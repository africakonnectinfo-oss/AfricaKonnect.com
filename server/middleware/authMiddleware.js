const jwt = require('jsonwebtoken');
const { findUserById } = require('../models/userModel');
const { getExpertProfile } = require('../models/expertModel');

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

// Protect routes - verify JWT token
const protect = async (req, res, next) => {
    let token;

    // Check for token in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Get token from header
            token = req.headers.authorization.split(' ')[1];

            // Verify token
            const decoded = jwt.verify(token, JWT_SECRET);

            // Get user from token
            req.user = await findUserById(decoded.id);

            if (!req.user) {
                return res.status(401).json({ message: 'Not authorized, user not found' });
            }

            // Remove password hash
            delete req.user.password_hash;

            next();
        } catch (error) {
            console.error('Auth middleware error:', error);
            return res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        return res.status(401).json({ message: 'Not authorized, no token' });
    }
};

// Authorize specific roles
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                message: `User role '${req.user.role}' is not authorized to access this route`
            });
        }

        next();
    };
};

// Optional auth - attach user if token exists but don't require it
const optionalAuth = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, JWT_SECRET);
            req.user = await findUserById(decoded.id);
            delete req.user?.password_hash;
        } catch (error) {
            // Token invalid but continue anyway
            console.log('Optional auth: Invalid token, continuing without user');
        }
    }

    next();
};

/**
 * Require email verification
 */
const requireEmailVerification = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'Not authenticated' });
        }

        if (!req.user.email_verified) {
            return res.status(403).json({
                message: 'Please verify your email address to access this feature',
                code: 'EMAIL_NOT_VERIFIED'
            });
        }

        next();
    } catch (error) {
        console.error('Email verification middleware error:', error);
        return res.status(500).json({ message: error.message });
    }
};

/**
 * Require profile completeness (for experts)
 */
const requireProfileComplete = (minPercentage = 90) => {
    return async (req, res, next) => {
        try {
            if (!req.user) {
                return res.status(401).json({ message: 'Not authenticated' });
            }

            // Only check for experts
            if (req.user.role !== 'expert') {
                return next();
            }

            const profile = await getExpertProfile(req.user.id);

            if (!profile) {
                return res.status(403).json({
                    message: 'Please complete your expert profile first',
                    code: 'PROFILE_INCOMPLETE',
                    completeness: 0
                });
            }

            if (profile.profile_completeness < minPercentage) {
                return res.status(403).json({
                    message: `Your profile must be at least ${minPercentage}% complete to access this feature`,
                    code: 'PROFILE_INCOMPLETE',
                    completeness: profile.profile_completeness,
                    required: minPercentage
                });
            }

            next();
        } catch (error) {
            console.error('Profile completeness middleware error:', error);
            return res.status(500).json({ message: error.message });
        }
    };
};

/**
 * Require expert to be verified
 */
const requireVerifiedExpert = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'Not authenticated' });
        }

        if (req.user.role !== 'expert') {
            return res.status(403).json({ message: 'This feature is only available to experts' });
        }

        const profile = await getExpertProfile(req.user.id);

        if (!profile) {
            return res.status(403).json({
                message: 'Please create your expert profile first',
                code: 'NO_EXPERT_PROFILE'
            });
        }

        if (profile.vetting_status !== 'verified') {
            return res.status(403).json({
                message: 'Your expert profile must be verified to access this feature',
                code: 'EXPERT_NOT_VERIFIED',
                vettingStatus: profile.vetting_status
            });
        }

        next();
    } catch (error) {
        console.error('Verified expert middleware error:', error);
        return res.status(500).json({ message: error.message });
    }
};

/**
 * Admin only
 */
const adminOnly = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ message: 'Not authenticated' });
    }

    if (req.user.role !== 'admin') {
        return res.status(403).json({
            message: 'Access denied. Admin privileges required.',
            code: 'ADMIN_ONLY'
        });
    }

    next();
};

module.exports = {
    protect,
    authorize,
    optionalAuth,
    requireEmailVerification,
    requireProfileComplete,
    requireVerifiedExpert,
    adminOnly
};
