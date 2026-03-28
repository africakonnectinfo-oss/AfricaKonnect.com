async function testRapidAPI() {
    const url = 'https://chatgpt-vision1.p.rapidapi.com/matagvision2';
    const options = {
        method: 'POST',
        headers: {
            'x-rapidapi-key': 'c7e5534adbmshe7aeff69caa00e0p1b6db5jsn7fb9d7c8861b',
            'x-rapidapi-host': 'chatgpt-vision1.p.rapidapi.com',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            messages: [
                {
                    role: "user",
                    content: [
                        { type: "text", text: "Hello! Reply with 'ready' if you can hear me." }
                    ]
                }
            ],
            web_access: false
        })
    };

    try {
        const response = await fetch(url, options);
        const result = await response.text();
        console.log("RESPONSE HTTP", response.status);
        console.log("BODY", result);
    } catch (error) {
        console.error(error);
    }
}

testRapidAPI();
