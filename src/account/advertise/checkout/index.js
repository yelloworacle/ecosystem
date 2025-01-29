(function () {
	let environment = "production"; // production, test

	if (
		window.location.host.startsWith("test.") ||
		window.location.host.startsWith("dev.")
	) {
		environment = "test";
	}

	let productionPk =
		"pk_live_51OoykOIMlR98agX1eiWRfz080ZdLitzBnAF75vbXecQBfHdy8sAu5h8B0au8lVzLKqQSiI2D1xQS8ZZoSFBEuXPr007I24duUf";
	let testPk =
		"pk_test_51OK9b5DSpIU4j2Joz6AeDvWPQEpoWhRweNS6Hevwvza5IcHwTpgTGTNU5GGMZUiQYzeSBifqV8AWaT3OtjUAVwXt00c3hmBILe";

	let pk = environment === "production" ? productionPk : testPk;

	// Function to load Stripe library dynamically
	function loadStripeLibrary(callback) {
		var script = document.createElement("script");
		script.src = "https://js.stripe.com/v3/";
		script.onload = function () {
			callback();
		};
		document.head.appendChild(script);
	}

	// Load Stripe and initialize
	loadStripeLibrary(function () {
		const stripe = Stripe(pk);
		const elements = stripe.elements();

		const style = {
			base: {
				fontSize: "16px",
				color: "#32325d"
			}
		};

		const card = elements.create("card", { style: style });
		card.mount("#payment-method-element");

		// Form submission
		const form = document.getElementById("payment-method-form");
		form.addEventListener("submit", async function (event) {
			event.preventDefault();

			try {
				card._parent.getValue = () => card;

				let argument = {
					name: "stripe",
					method: "paymentMethods.create",
					form
				};

				argument.data = {
					stripe: await CoCreate.api.getData(argument)
				};

				const { paymentMethod, error } =
					await stripe.createPaymentMethod(argument.data.stripe);

				if (error) {
					throw new Error(
						`Payment Method creation failed: ${error.message}`
					);
				}

				argument.data.stripe = paymentMethod;

				CoCreate.api.setData(argument);

				if (event.detail && event.detail.element)
					event.detail.element.dispatchEvent(
						new CustomEvent("submitted", {
							detail: paymentMethod
						})
					);
			} catch (err) {
				console.error("Error:", err.message);
			}
		});
	});
})();
