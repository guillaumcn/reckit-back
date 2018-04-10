var Error = {};

Error.INTERNAL = {code: '000', message: 'An internal error has occured'};
Error.NOT_FOUND = {code: '100', message: 'Object not found'};
Error.NO_TOKEN = {code: '200', message: 'No access token was provided'};
Error.EXPIRED_TOKEN = {code: '201', message: 'This token oken has expired'};
Error.CONNECTION_FAILED = {code: '202', message: 'Wrong email or password'};
Error.WRONG_PARAMETERS = {code: '300', message: 'Invalid or missing parameters'};
Error.NOT_ALLOWED = {code: '400', message: 'Operation not allowed'};

module.exports = Error;