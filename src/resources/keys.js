module.exports = [
    {
        "_id": "652c8d62a91e10cd4800fffb",
        "type": "key",
        "key": "a68534d5-6641-419a-b974-60f0757ae405",
        "hosts": [
            "*"
        ],
        "actions": {
            "object": {
                "*": {
                    "$array": "users",
                    "$eq._id": "this.userId"
                },
                "read": {
                    "$array": "questions"
                }
            },
            "checkSession": true,
            "signIn": true,
            "signUp": true,
            "updateUserStatus": true,
            "isUnique": true
        },
        "default": true
    },
    {
        "_id": "657726510fee1c6415f70760",
        "type": "role",
        "name": "user",
        "actions": {
            "stripe": {
                "subscriptions.create": true,
                "subscriptions.update": true
            },
            "openai": {
                "chat": true
            }
        }
    }

]