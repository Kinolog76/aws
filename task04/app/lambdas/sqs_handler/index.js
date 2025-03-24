exports.handler = async (event) => {
    event.Records.forEach(record => {
        console.log("Received SQS Message:", record.body);
    });
};