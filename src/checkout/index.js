(function () {
    let environment = "production" // production, test

    if (window.location.host.startsWith("test.") || window.location.host.startsWith("dev.")) {
        environment = 'test'
    }

    let productionPk = "pk_live_51OK9b5DSpIU4j2Jo6VbxSw3F8LHhru5wn2FZyE7pqWtRqHoD1hBrtDkxMySPpJNEyGTEoPE0Nfs7bGFqkB5UX17300yYKufL6v"
    let testPk = "pk_test_51OK9b5DSpIU4j2Joz6AeDvWPQEpoWhRweNS6Hevwvza5IcHwTpgTGTNU5GGMZUiQYzeSBifqV8AWaT3OtjUAVwXt00c3hmBILe"

    let pk, price, coupon
    if (environment === 'production') {
        pk = productionPk
        price = 'price_1OPdVuDSpIU4j2JoDTXa1i6J'
        memberPrice = 'price_1Oj6Q2DSpIU4j2JoMlEOKZ5S'
        coupon = 'miY3GbhY'
    } else {
        pk = testPk
        price = 'price_1OP7WaDSpIU4j2JoOhYOpB4U'
        memberPrice = 'price_1OgphfDSpIU4j2Jos30M9l41'
        coupon = 'SUHCpxy7'
    }

    // Function to load Stripe library dynamically
    function loadStripeLibrary(callback) {
        var script = document.createElement('script');
        script.src = 'https://js.stripe.com/v3/';
        script.onload = function () {
            // Stripe library loaded
            callback();
        };
        document.head.appendChild(script);
    }

    // Using the function to load Stripe and initialize
    loadStripeLibrary(function () {
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
        form.addEventListener("submit", async function (event) {
            event.preventDefault();
            const submitButton = form.querySelector(
                'button[type="submit"]'
            );
            submitButton.innerHTML = "Processing";

            var destination = document.getElementById("ambassadorAccount").value
            var additionalData = {
                customer: document.getElementById("customer").value,
                name: document.getElementById("name").value,
                email: document.getElementById("email").value,
            };

            // let paymentIntent = {
            //     method: "stripe.paymentIntents.create",
            //     broadcast: false,
            //     environment,
            //     stripe: {
            //         customer: additionalData.customer,
            //         items: [{ price }, { price: memberPrice, quantity: 0 }],
            //         coupon: coupon,
            //         expand: ['latest_invoice.payment_intent']
            //     }
            // }

            // paymentIntent = await CoCreate.socket.send(paymentIntent);
            // if (!paymentIntent || !paymentIntent.clientSecret)
            //     return

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

                        let data = {
                            method: "stripe.subscriptions.create",
                            broadcast: false,
                            stripe: {
                                customer: additionalData.customer,
                                items: [{ price }, { price: memberPrice, quantity: 0 }],
                                coupon: coupon,
                                expand: ['latest_invoice.payment_intent']
                            },
                            environment
                        }

                        if (destination) {
                            data.stripe.application_fee_percent = 15
                            data.stripe.transfer_data = {
                                destination
                            }
                        }

                        // if (destination) {
                        //     data.stripe.application_fee_percent = 85
                        //     // data.stripe.$param1 = { stripeAccount: destination }
                        // }


                        data = await CoCreate.socket.send(data);

                        if (data.stripe.id) {
                            await CoCreate.crud.send({
                                method: "object.update",
                                broadcast: false,
                                array: "users",
                                object: {
                                    _id: data.user_id,
                                    customerId: additionalData.customer,
                                    subscription: "6571fe530c48ef6970900a82",
                                    subscriptionId: data.stripe.id,
                                    subscriptionItemId: data.stripe.items.data[1].id
                                },
                            });


                            // if (destination) {
                            //     let amount = data.stripe.items.data[0].price.unit_amount * 17;
                            //     amount = Math.round((amount * 15) / 100);
                            //     await CoCreate.socket.send({
                            //         method: "stripe.transfers.create",
                            //         stripe: {
                            //             amount, // Amount in your account's currency (MXN)
                            //             currency: 'mxn', // Your account's currency
                            //             destination,
                            //         }
                            //     });
                            // }

                            submitButton.innerHTML = "Payment Successful";
                            window.localStorage.setItem('subscription', '6571fe530c48ef6970900a82')

                            setTimeout(function () {
                                window.history.back();
                            }, 3000);
                        } else {
                            submitButton.innerHTML = "Payment Failed";
                        }

                    }
                });
        });
    });

})();

