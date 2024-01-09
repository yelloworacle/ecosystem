module.exports = {
    "organization_id": "652c8d62679eca03e0b116a7",
    "host": {
        "$branch": {
            "main": "wss://yelloworacle.com",
            "dev": "wss://dev.yelloworacle.com",
            "test": "wss://test.yelloworacle.com"
        }
    },
    "apikey": "c685ywd5-9031-224a-b974-60f07jety103",
    "directories": [
        {
            "entry": "./src",
            "exclude": [
                ".txt"
            ],
            "array": "files",
            "object": {
                "name": "{{name}}",
                "src": "{{source}}",
                "host": [
                    "*"
                ],
                "directory": "/",
                "path": "{{path}}",
                "pathname": "{{pathname}}",
                "content-type": "{{content-type}}",
                "public": "true"
            }
        }
    ]
};