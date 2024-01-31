let input = document.querySelector('[value="$ip"]')
if (input) {
    fetch('https://api.ipify.org?format=json')
        .then(response => response.json())
        .then(data => {
            input.value = data.ip;
        })
}