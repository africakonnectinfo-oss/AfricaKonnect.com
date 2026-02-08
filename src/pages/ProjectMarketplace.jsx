import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../lib/api';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import SEO from '../../components/SEO';
import {
    Search, Filter, DollarSign, Clock, MapPin,
    Briefcase, TrendingUp, ChevronRight, Users,
    Calendar, Tag, Loader2
} from 'lucide-react';
import { toast } from 'sonner';

const ProjectMarketplace = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({
        minBudget: '',
        maxBudget: '',
        skills: [],
        sortBy: 'recent' // 'recent', 'budget_high', 'budget_low', 'deadline'
    });
    const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'

    useEffect(() => {
        if (user?.role !== 'expert') {
            toast.error('Only experts can access the marketplace');
            navigate('/');
            return;
        }
        fetchMarketplaceProjects();
    }, [user, navigate]);

    const fetchMarketplaceProjects = async () => {
        setLoading(true);
        try {
            // TODO: Update API endpoint to support marketplace filtering
            const response = await api.get('/projects/marketplace', {
                params: {
                    search: searchTerm,
                    minBudget: filters.minBudget,
                    maxBudget: filters.maxBudget,
                    skills: filters.skills.join(','),
                    sortBy: filters.sortBy
                }
            });
            setProjects(response.data.projects || []);
        } catch (error) {
            console.error('Failed to fetch marketplace projects:', error);
            toast.error('Failed to load projects');
            // For now, use mock data until backend endpoint is ready
            setProjects([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = () => {
        fetchMarketplaceProjects();
    };

    const handleViewProject = (projectId) => {
        navigate(`/marketplace/projects/${projectId}`);
    };

    const ProjectCard = ({ project }) => (
        <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => handleViewProject(project.id)}>
            <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{project.title}</h3>
                    <p className="text-gray-600 text-sm line-clamp-2">{project.description}</p>
                </div>
                {project.bid_count > 0 && (
                    <div className="ml-4 flex items-center gap-1 text-sm text-gray-500">
                        <Users size={16} />
                        <span>{project.bid_count} bids</span>
                    </div>
                )}
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
                {project.required_skills?.slice(0, 3).map((skill, idx) => (
                    <span key={idx} className="px-3 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full">
                        {skill}
                    </span>
                ))}
                {project.required_skills?.length > 3 && (
                    <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
                        +{project.required_skills.length - 3} more
                    </span>
                )}
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                    <DollarSign size={16} className="text-green-600" />
                    <span className="font-semibold">
                        ${project.min_budget?.toLocaleString()} - ${project.max_budget?.toLocaleString()}
                    </span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                    <Clock size={16} className="text-blue-600" />
                    <span>{project.duration || 'Flexible'}</span>
                </div>
                {project.location && (
                    <div className="flex items-center gap-2 text-gray-600">
                        <MapPin size={16} className="text-red-600" />
                        <span>{project.location}</span>
                    </div>
                )}
                {project.bidding_deadline && (
                    <div className="flex items-center gap-2 text-gray-600">
                        <Calendar size={16} className="text-orange-600" />
                        <span className="text-xs">
                            Deadline: {new Date(project.bidding_deadline).toLocaleDateString()}
                        </span>
                    </div>
                )}
            </div>

            <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                        <Briefcase size={16} className="text-gray-600" />
                    </div>
                    <span className="text-sm text-gray-600">{project.client_name}</span>
                </div>
                <Button size="sm" className="flex items-center gap-2">
                    View Details
                    <ChevronRight size={16} />
                </Button>
            </div>
        </Card>
    );

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="animate-spin text-primary" size={48} />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50/50 py-24 px-4 sm:px-6">
            <SEO title="Project Marketplace" />

            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">Project Marketplace</h1>
                    <p className="text-gray-600">Browse and bid on open projects from clients worldwide</p>
                </div>

                {/* Search and Filters */}
                <Card className="p-6 mb-8">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="text"
                                placeholder="Search projects by title, description, or skills..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                            />
                        </div>
                        <Button onClick={handleSearch} className="flex items-center gap-2">
                            <Search size={20} />
                            Search
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Min Budget</label>
                            <div className="relative">
                                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                                <input
                                    type="number"
                                    placeholder="0"
                                    value={filters.minBudget}
                                    onChange={(e) => setFilters({ ...filters, minBudget: e.target.value })}
                                    className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Max Budget</label>
                            <div className="relative">
                                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                                <input
                                    type="number"
                                    placeholder="Any"
                                    value={filters.maxBudget}
                                    onChange={(e) => setFilters({ ...filters, maxBudget: e.target.value })}
                                    className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
                            <select
                                value={filters.sortBy}
                                onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                            >
                                <option value="recent">Most Recent</option>
                                <option value="budget_high">Highest Budget</option>
                                <option value="budget_low">Lowest Budget</option>
                                <option value="deadline">Deadline Soon</option>
                            </select>
                        </div>
                        <div className="flex items-end">
                            <Button variant="outline" className="w-full flex items-center justify-center gap-2">
                                <Filter size={16} />
                                More Filters
                            </Button>
                        </div>
                    </div>
                </Card>

                {/* Results Summary */}
                <div className="flex items-center justify-between mb-6">
                    <p className="text-gray-600">
                        <span className="font-semibold text-gray-900">{projects.length}</span> projects available
                    </p>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-2 rounded ${viewMode === 'grid' ? 'bg-primary text-white' : 'bg-gray-200 text-gray-600'}`}
                        >
                            <Tag size={20} />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-2 rounded ${viewMode === 'list' ? 'bg-primary text-white' : 'bg-gray-200 text-gray-600'}`}
                        >
                            <TrendingUp size={20} />
                        </button>
                    </div>
                </div>

                {/* Projects Grid */}
                {projects.length === 0 ? (
                    <Card className="p-12 text-center">
                        <Briefcase className="mx-auto text-gray-400 mb-4" size={64} />
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">No projects found</h3>
                        <p className="text-gray-600 mb-6">
                            There are no open projects matching your criteria at the moment.
                        </p>
                        <Button onClick={() => {
                            setSearchTerm('');
                            setFilters({ minBudget: '', maxBudget: '', skills: [], sortBy: 'recent' });
                            fetchMarketplaceProjects();
                        }}>
                            Clear Filters
                        </Button>
                    </Card>
                ) : (
                    <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
                        {projects.map((project) => (
                            <ProjectCard key={project.id} project={project} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProjectMarketplace;
