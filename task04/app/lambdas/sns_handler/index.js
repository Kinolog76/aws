exports.handler = async (event) => {
    event.Records.forEach(record => {
        console.log("Received SNS Message:", record.Sns.Message);
    });
};