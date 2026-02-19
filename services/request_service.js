const axios = require("axios");

const retryDelayMs = 500;
const MaxRetries = 10;

const makeRequestWithExponentialRetries = async ({
  url,
  type,
  headers,
  data = undefined,
}) => {
  let response = {};
  let error = {};
  if (type === "GET") {
    for (let i = 0; i < MaxRetries; i++) {
      try {
        response = await axios({
          method: type,
          url,
          headers,
        });
        return response;
      } catch (err) {
        if (
          err.response &&
          (err.response.status == 400 || err.response.status == 404)
        )
          return {
            error: "there was an error on this request composition",
            code: err.response.status,
          };
        error["error"] = err;
        console.log(err);
        error["code"] = err.response && err.response.status;
        await new Promise((resolve) =>
          setTimeout(resolve, Math.pow(2, i) * retryDelayMs)
        );
        console.log(`url: ${url} retry: ${i + 1}`);
      } finally {
        if (response.status === 200 || !error) break;
      }
    }
    return response && response.data && response.status === 200
      ? response
      : error;
  }
  for (let i = 0; i < MaxRetries; i++) {
    try {
      response = await axios({
        method: type,
        url,
        data,
        headers,
      });

      return response;
    } catch (err) {
      console.log(`err: ${err}`);
      console.log({ data });

      if (err.response && err.response.status === 500) break;
      if (
        err.response &&
        (err.response.status == 400 || err.response.status == 404)
      )
        return {
          error: "there was an error on this request composition",
          code: err.response.status,
        };
      error["error"] = err;
      error["code"] = err.response && err.response.status;
      await new Promise((resolve) =>
        setTimeout(resolve, Math.pow(2, i) * retryDelayMs)
      );
      console.log(`url: ${url} retry: ${i + 1}`);
      // await writeLog(`url: ${url} retry: ${i + 1}`);
      // await writeLogError(err);
    } finally {
      if (response.status === 200 || !error) break;
    }
  }
  return response && response.data && response.status === 200
    ? response
    : error;
};

const makeHubspotRequestWithExponentialRetries = async ({
  hubspotClient,
  requestFunctionRoute,
  requestFunctionParam,
}) => {
  let response = {};
  let error = {};
  const minTimeBetweenRequests = 100;

  for (let i = 0; i < MaxRetries; i++) {
    try {
      await new Promise((resolve) =>
        setTimeout(resolve, minTimeBetweenRequests)
      );
      if (requestFunctionRoute.length === 4)
        response = await hubspotClient[requestFunctionRoute[0]][
          requestFunctionRoute[1]
        ][requestFunctionRoute[2]][requestFunctionRoute[3]](
          ...requestFunctionParam
        );
      if (requestFunctionRoute.length === 5)
        response = await hubspotClient[requestFunctionRoute[0]][
          requestFunctionRoute[1]
        ][requestFunctionRoute[2]][requestFunctionRoute[3]][
          requestFunctionRoute[4]
        ](...requestFunctionParam);
      return response;
    } catch (err) {
      console.log(err);
      error["error"] = err;
      await new Promise((resolve) =>
        setTimeout(resolve, Math.pow(2, i) * retryDelayMs)
      );
      console.log(`request retry: ${i + 1}: `, requestFunctionRoute[3]);
      // await writeLog(`request: ${requestFunctionRoute[3]} retry: ${i + 1}`);
      // await writeLogError({ code: err.code, message: err.body.message });
    } finally {
      if (
        (error && error["error"] && error["error"].code === 400) ||
        (response && response.status === 200) ||
        !error
      ) {
        console.log(
          `error: ${requestFunctionRoute[2]} ${requestFunctionRoute[3]}`
        );
        break;
      }
    }
  }

  if (response && response.results) {
    return response;
  } else {
    throw error;
  }
};

module.exports = {
  makeRequestWithExponentialRetries,
  makeHubspotRequestWithExponentialRetries,
};
