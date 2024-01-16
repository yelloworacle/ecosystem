const environment = "test" // production, test
let productionPk = "pk_live_51OK9b5DSpIU4j2Jo6VbxSw3F8LHhru5wn2FZyE7pqWtRqHoD1hBrtDkxMySPpJNEyGTEoPE0Nfs7bGFqkB5UX17300yYKufL6v"
let testPk = "pk_test_51OK9b5DSpIU4j2Joz6AeDvWPQEpoWhRweNS6Hevwvza5IcHwTpgTGTNU5GGMZUiQYzeSBifqV8AWaT3OtjUAVwXt00c3hmBILe"


let pk, price, coupon
if (environment === 'production') {
    pk = productionPk
    price = 'price_1OPdVuDSpIU4j2JoDTXa1i6J'
    coupon = 'miY3GbhY'
} else {
    pk = testPk
    price = 'price_1OP7WaDSpIU4j2JoOhYOpB4U'
    coupon = 'SUHCpxy7'
}

const stripe = Stripe(pk);

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
        customer: document.getElementById("customer").value,
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
                additionalData.source = result.token.id;

                if (!additionalData.customer) {
                    let data = await CoCreate.socket.send({
                        method: "stripe.customers.create",
                        broadcast: false,
                        stripe: additionalData,
                        environment
                    });
                    if (!data.stripe || !data.stripe.id)
                        return submitButton.innerHTML = "Payment Failed";

                    additionalData.customer = data.stripe.id;

                }

                let data = await CoCreate.socket.send({
                    method: "stripe.subscriptions.create",
                    broadcast: false,
                    stripe: {
                        customer: additionalData.customer,
                        items: [{ price }],
                        coupon: coupon,
                        expand: ['latest_invoice.payment_intent']
                    },
                    environment
                });

                if (data.stripe.id) {
                    CoCreate.crud.send({
                        method: "object.update",
                        broadcast: false,
                        array: "users",
                        object: {
                            _id: data.user_id,
                            customerId: additionalData.customer,
                            subscription: "6571fe530c48ef6970900a82",
                            subscriptionId: data.stripe.id
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
