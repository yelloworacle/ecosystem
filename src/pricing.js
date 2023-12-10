var stripe = Stripe(
    "pk_test_51OK9b5DSpIU4j2Joz6AeDvWPQEpoWhRweNS6Hevwvza5IcHwTpgTGTNU5GGMZUiQYzeSBifqV8AWaT3OtjUAVwXt00c3hmBILe"
); // Replace with your publishable key
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
                additionalData.price =
                    "price_1OKQckDSpIU4j2JoNh3RvJJC";
                additionalData.subscription_id =
                    "6571fe530c48ef6970900a82";
                let subscription = await CoCreate.socket.send({
                    method: "stripe.subscriptions.create",
                    broadcast: false,
                    stripe: additionalData,
                });

                console.log("subscription", subscription);
                // let userSubscription = await CoCreate.crud.send({
                //     method: "object.update",
                //     broadcast: false,
                //     array: "users",
                //     object: {
                //         _id: subscription.user_id,
                //         subscription: "6571fe530c48ef6970900a82",
                //     },
                // });

                submitButton.innerHTML = "Payment Successful";
                window.localStorage.setItem('subscription', '6571fe530c48ef6970900a82')
                setTimeout(function () {
                    // window.location = "/";
                    window.location.href = "/"
                }, 2000);
            }
        });
});
