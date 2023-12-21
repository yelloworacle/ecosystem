const environment = "production" // production, test
let productionPk = "pk_live_51OK9b5DSpIU4j2Jo6VbxSw3F8LHhru5wn2FZyE7pqWtRqHoD1hBrtDkxMySPpJNEyGTEoPE0Nfs7bGFqkB5UX17300yYKufL6v"
let testPk = "pk_test_51OK9b5DSpIU4j2Joz6AeDvWPQEpoWhRweNS6Hevwvza5IcHwTpgTGTNU5GGMZUiQYzeSBifqV8AWaT3OtjUAVwXt00c3hmBILe"


let pk
if (environment === 'production')
    pk = productionPk
else
    pk = testPk

const stripe = Stripe(pk);

// "pk_test_51OK9b5DSpIU4j2Joz6AeDvWPQEpoWhRweNS6Hevwvza5IcHwTpgTGTNU5GGMZUiQYzeSBifqV8AWaT3OtjUAVwXt00c3hmBILe"
// "pk_live_51OK9b5DSpIU4j2Jo6VbxSw3F8LHhru5wn2FZyE7pqWtRqHoD1hBrtDkxMySPpJNEyGTEoPE0Nfs7bGFqkB5UX17300yYKufL6v"

var elements = stripe.elements();

var style = {
    base: {
        fontSize: "16px",
        color: "#32325d",
    },
};

var card = elements.create("card", { style: style });
card.mount("#card-element");

var form = document.getElementById("payment-form");
form.addEventListener("submit", function (event) {
    event.preventDefault();
    const submitButton = form.querySelector(
        'button[type="submit"]'
    );
    submitButton.innerHTML = "Processing";

    var additionalData = {
        name: document.getElementById("name").value,
        email: document.getElementById("email").value,
    };

    stripe
        .createToken(card, additionalData)
        .then(async function (result) {
            if (result.error) {
                // Inform the user if there was an error
                console.log(result.error.message);
                submitButton.innerHTML = "Payment Failed";
            } else {
                // Send the token and additional data to your server
                additionalData.token = result.token.id;
                additionalData.discountPriceId =
                    "price_1OP7VGDSpIU4j2JoOijeqOjw";
                additionalData.trial_period_days = 30;
                additionalData.priceId =
                    "price_1OP7WaDSpIU4j2JoOhYOpB4U";
                additionalData.subscription_id =
                    "6571fe530c48ef6970900a82";
                let data = await CoCreate.socket.send({
                    method: "stripe.subscriptions.create",
                    broadcast: false,
                    stripe: additionalData,
                    environment
                });

                if (data.stripe.subscription.id) {
                    CoCreate.crud.send({
                        method: "object.update",
                        broadcast: false,
                        array: "users",
                        object: {
                            _id: data.user_id,
                            subscription: "6571fe530c48ef6970900a82",
                            subscriptionId: data.stripe.subscription.id
                        },
                    });

                    submitButton.innerHTML = "Payment Successful";
                    window.localStorage.setItem('subscription', '6571fe530c48ef6970900a82')

                    setTimeout(function () {
                        // window.location = "/";
                        window.location.href = "/"
                    }, 3000);
                } else {
                    submitButton.innerHTML = "Payment Failed";
                }

            }
        });
});
