CoCreate.actions.init({
    name: "cancelSubscription",
    callback: async (action) => {
        let subscriptionId = action.form[0].getValue()
        if (subscriptionId) {
            let subscription = await CoCreate.socket.send({
                method: "stripe.subscriptions.update",
                stripe: {
                    subscriptionId,
                    subscriptions: {
                        cancel_at_period_end: true,
                    }
                }
            });
            if (!subscription.error)
                action.element.innerHTML = "Unsubscribe Successful";
            else
                action.element.innerHTML = "Unsubscribe Failed";
        } else {
            action.element.innerHTML = "Unsubscribe Failed";
        }

        document.dispatchEvent(new CustomEvent('cancelSubscription', {
            detail: {}
        }));

    }
});
