async function fetchIP() {
    const input = document.querySelector('[value="$ip"]');
    if (!input) return;

    try {
        const response = await fetch("https://ipinfo.io/json");
        if (!response.ok) throw new Error('Network response was not ok');

        const data = await response.json();
        console.log("IP data received:", data);
        input.value = data.ip; // Make sure the JSON structure includes `ip` directly
    } catch (error) {
        console.error('Error fetching IP:', error);
    }
}

fetchIP()