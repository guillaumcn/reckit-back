/**********************************
 Initialisation
 **********************************/

var express = require('express');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var fileUpload = require('express-fileupload');
var fs = require('fs');
var Error = require("./error");

var app = express();

app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use(fileUpload());
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

var options = {
    server: { socketOptions: { keepAlive: 300000, connectTimeoutMS: 30000 } },
    replset: { socketOptions: { keepAlive: 300000, connectTimeoutMS: 30000 } }
};
var urlmongo = "mongodb://guillaumcn:password@ds237848.mlab.com:37848/restfrugaldb";
mongoose.connect(urlmongo, options);
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'Failed to connect to MongoDB'));

/**********************************
 Modeles
 **********************************/

var User = require("./models/user");
var AccessToken = require("./models/accessToken");
var RefreshToken = require("./models/refreshToken");
// var Record = require("./models/record");
// var Tag = require("./models/tag");


/**********************************
 Router
 **********************************/

var myRouter = express.Router();

/**********************************
 Functions
 **********************************/

/**********************************
 Auth
 **********************************/

var getAccessToken = (token) => {
    return new Promise((resolve, reject) => {
        AccessToken.findOne({ accessToken: token }, (err, accessToken) => {
            if (err) {
                reject(Error.INTERNAL);
                return;
            }
            if (!accessToken) {
                reject(Error.NOT_FOUND);
                return;
            }
            resolve(accessToken);
        });
    });
};

var getRefreshToken = (token) => {
    return new Promise((resolve, reject) => {
        RefreshToken.findOne({ refreshToken: token }, (err, refreshToken) => {
            if (err) {
                reject(Error.INTERNAL);
                return;
            }
            if (!refreshToken) {
                reject(Error.NOT_FOUND);
                return;
            }
            resolve(refreshToken);
        });
    });
};


var generateTokens = (userId, refreshToken) => {
    return new Promise((resolve, reject) => {
        var newAccessToken = new AccessToken();
        newAccessToken.accessToken = Math.random().toString(36).substr(2) + Math.random().toString(36).substr(2);
        newAccessToken.expiration = Date.now() + 3600000;
        newAccessToken.user = userId;
        newAccessToken.save((err) => {
            if (err) {
                reject(Error.INTERNAL);
                return;
            }
            var finalResult = { accessToken: newAccessToken.accessToken };
            if (!refreshToken) {
                var newRefreshToken = new RefreshToken();
                newRefreshToken.refreshToken = Math.random().toString(36).substr(2) + Math.random().toString(36).substr(2);
                newRefreshToken.expiration = Date.now() + 2592000000;
                newRefreshToken.user = userId;
                newRefreshToken.save((err) => {
                    if (err) {
                        reject(Error.INTERNAL);
                        return;
                    }
                    finalResult.refreshToken = newRefreshToken.refreshToken;
                    resolve(finalResult);
                });
            } else {
                getRefreshToken(refreshToken)
                    .then((refreshToken) => {
                        refreshToken.expiration = Date.now() + 2592000000;
                        refreshToken.save((err) => {
                            if (err) {
                                reject(Error.INTERNAL);
                                return;
                            }
                            finalResult.refreshToken = refreshToken.refreshToken;
                            resolve(finalResult);
                        });
                    })
                    .catch((error) => {
                        reject(error);
                    });
            }
        });
    });
};

/**********************************
 Token verification
 **********************************/

var authenticate = (authorizationHeader) => {
    return new Promise((resolve, reject) => {
        if (!authorizationHeader || authorizationHeader.indexOf('Bearer') === -1) {
            reject(Error.NO_TOKEN);
            return;
        } 
        var token = authorizationHeader.substring(7, authorizationHeader.length);
        getAccessToken(token)
            .then((accessToken) => {
                if (accessToken.expiration < Date.now()) {
                    reject(Error.EXPIRED_TOKEN);
                    return;
                }
                getUserById(accessToken.user)
                    .then((user) => {
                        updateUser(user, null, new Date())
                            .then((user) => {
                                resolve(user);
                            })
                            .catch(function (error) {
                                reject(error);
                            });
                    })
                    .catch(function (error) {
                        reject(error);
                    });
            })
            .catch(function (error) {
                reject(error);
            });
    });
};

/**********************************
 Users
 **********************************/

var createUser = (email, password) => {
    return new Promise((resolve, reject) => {
        var user = new User();
        user.email = email;
        user.password = password;
        user.lastActivity = new Date();
        user.save(function (err, user) {
            if (err) {
                reject(Error.INTERNAL);
                return;
            }
            resolve(user);
        });
    });
};

var updateUser = (user, password, lastActivity) => {
    return new Promise((resolve, reject) => {
        user.lastActivity = lastActivity || user.lastActivity;
        user.password = password || user.password;
        user.save((err, user) => {
            if (err) {
                reject(Error.INTERNAL);
                return;
            }
            resolve(user);
        });
    });
};


var getUserById = function (userId) {
    return new Promise(function (resolve, reject) {
        User.findById(userId, function (err, user) {
            if (err) {
                reject(Error.INTERNAL);
                return;
            }
            if (!user) {
                reject(Error.NOT_FOUND);
                return;
            }
            resolve(user);
        });
    });
};

var getUser = function (query) {
    return new Promise(function (resolve, reject) {
        User.findOne(query, function (err, user) {
            if (err) {
                reject(Error.INTERNAL);
                return;
            }
            if (!user) {
                reject(Error.NOT_FOUND);
                return;
            }
            resolve(user);
        });
    });
};

var getUsers = function (query) {
    return new Promise(function (resolve, reject) {
        User.find(query, function (err, docs) {
            if (err) {
                reject(Error.INTERNAL);
                return;
            }
            resolve(docs);
        });
    });
};

/**********************************
 Record
 **********************************/
/*
var createRecord = (name, data, recorder, orator, type, duration) => {
    return new Promise((resolve, reject) => {
        var record = new Record();
        record.name = name;
        record.recorder = recorder;
        record.orator = orator;
        record.type = type;
        record.duration = duration;
        record.save((err, record) => {
            if (err) {
                reject(Error.INTERNAL);
                return;
            }

            fs.writeFile('./records/'+record._id+'/'+name+'.mp3', data, 'utf8', (err) => {
                if (err) {
                    reject(Error.INTERNAL);
                    return;
                }
                resolve(record);
            });
        });
    });
};

var updateRecord = (name, data, type, duration) => {
    return new Promise((resolve, reject) => {
        var record = new Record();
        record.name = name || record.name;
        record.type = type || record.type;
        record.duration = duration || record.duration;
        record.save((err, record) => {
            if (err) {
                reject(Error.INTERNAL);
                return;
            }

            if (!data) {
                resolve(record);
                return;
            }
            fs.writeFile('./records/'+record._id+'/'+name+'.mp3', data, 'utf8', (err) => {
                if (err) {
                    reject(Error.INTERNAL);
                    return;
                }
                resolve(record);
            });
        });
    });
};


var getRecordById = function (recordId) {
    return new Promise(function (resolve, reject) {
        Record.findById(recordId, function (err, record) {
            if (err) {
                reject(Error.INTERNAL);
                return;
            }
            if (!record) {
                reject(Error.NOT_FOUND);
                return;
            }
            resolve(record);
        });
    });
};

var getRecord = function (query) {
    return new Promise(function (resolve, reject) {
        Record.findOne(query, function (err, record) {
            if (err) {
                reject(Error.INTERNAL);
                return;
            }
            if (!record) {
                reject(Error.NOT_FOUND);
                return;
            }
            resolve(record);
        });
    });
};

var getRecords = function (query) {
    return new Promise(function (resolve, reject) {
        Record.find(query, function (err, docs) {
            if (err) {
                reject(Error.INTERNAL);
                return;
            }
            resolve(docs);
        });
    });
};
*/
/**********************************
 Routes
 **********************************/

/**********************************
 Home
 **********************************/

myRouter.route('/')
    .all(function (req, res) {
        authenticate(req.headers.authorization)
            .then(function (user) {
                res.send('Bienvenue sur l\'API Reckit. Vous utilisez l\'api en tant que ' + user.email);
            })
            .catch(function (error) {
                res.json(error);
            });
    });

/**********************************
 Auth
 **********************************/

myRouter.route('/auth')
    .post(function (req, res) {
        var refreshToken = req.body.refreshToken;
        var email = req.body.email;
        var password = req.body.password;
        if (refreshToken) {
            getRefreshToken(refreshToken)
                .then(function (refreshToken) {
                    if (refreshToken.expiration < Date.now()) {
                        res.json(Error.EXPIRED_TOKEN);
                        return;
                    }
                    generateTokens(refreshToken.user, refreshToken.refreshToken)
                        .then(function (result) {
                            res.json(result);
                        })
                        .catch(function (error) {
                            res.json(error);
                        });
                })
                .catch(function (error) {
                    res.json(error);
                });
        } else {
            if (!email || !password) {
                res.json(Error.WRONG_PARAMETERS);
                return;
            }
            getUser({ 'email': email, 'password': password })
                .then(function (user) {
                    generateTokens(user._id)
                        .then(function (result) {
                            res.json(result);
                        })
                        .catch(function (error) {
                            res.json(error);
                        });
                })
                .catch(function (error) {
                    if (error.code == '100') {
                        res.json(Error.CONNECTION_FAILED);
                        return;
                    }
                    res.json(error);
                });
        }
    });

/**********************************
 Users
 **********************************/

myRouter.route('/users')
    .post(function (req, res) {
        if (!req.body.email || !req.body.password)
        {
            res.json(Error.WRONG_PARAMETERS);
            return;
        }

        createUser(req.body.email, req.body.password)
            .then(function (user) {
                generateTokens(user._id)
                    .then(function (result) {
                        res.json(result);
                    })
                    .catch(function (error) {
                        res.json(error);
                    });
            })
            .catch(function (error) {
                res.json(error);
            });
    })
    .get(function (req, res) {
        authenticate(req.headers.authorization)
            .then(function (user) {
                getUsers({})
                    .then(function (docs) {
                        res.json(docs);
                    })
                    .catch(function (error) {
                        res.json(error);
                    });
            })
            .catch(function (error) {
                res.json(error);
            });
    });

myRouter.route('/users/:userId')
    .delete(function (req, res) {
        authenticate(req.headers.authorization)
            .then(function (user) {
                if (user._id !== req.params.userId) {
                    res.json(Error.NOT_ALLOWED);
                    return;
                }
                User.remove({ _id: req.params.userId }, function (err) {
                    if (err) {
                        res.json(Error.INTERNAL);
                        return;
                    }
                    res.json({});
                });
            })
            .catch(function (error) {
                res.json(error);
            });
    })
    .get(function (req, res) {
            
                getUserById(req.params.userId)
                    .then(function (userResult) {
                        res.json(userResult);
                    })
                    .catch(function (error) {
                        res.json(error);
                    });
            });


app.use(myRouter);

app.listen(3000);