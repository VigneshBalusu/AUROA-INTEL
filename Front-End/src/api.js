const BASE_URL = "http://localhost:3000"; // Ensure this matches your backend URL

// Helper function to make API calls
export async function fetchData(endpoint, options = {}) {
    try {
        const response = await fetch(`${BASE_URL}${endpoint}`, {
            headers: { "Content-Type": "application/json" },
            ...options,
        });

        if (!response.ok) throw new Error(`Error: ${response.status}`);
        
        return response.json();
    } catch (error) {
        console.error("API Error:", error);
        throw error;
    }
}
