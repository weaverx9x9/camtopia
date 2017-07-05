// functions.js
// Helper functions for mongodb

var bcrypt = require('bcryptjs'),
	Q = require('q'),
	config = require('./config.js'); // contains all tokens and other private info

var mongodbUrl = 'mongodb://' + config.mongodbHost + ':27017/users';
var MongoClient = require('mongodb').MongoClient;

// For local-signup strategy
exports.localReg = function(username, password) {
	var deferred = Q.defer();

	MongoClient.connect(mongodbUrl, function(err, db) {
		var collection = db.collection('localUsers');

		// check if username is available
		collection.findOne({'username': username})
		.then(function(result) {
			if(null != result) {
				console.log("USERNAME ALREADY EXISTS: ", result.username);
				deferred.resolve(false); // username exists
			} else {
				var hash = bcrypt.hashSync(password, 8);
				var user = {
					"username": username,
					"password": hash,
					"avatar": "http://placekitten.com/g/50/50"
			};

			console.log("CREATING USER:", username);

			collection.insert(user)
				.then(function() {
					db.close();
					deferred.resolve(user);
				});
			}
		});
	});

	return deferred.promise;
}

// check if user exists
// if user exists check password
// if password matches, goto website
// else notify user of failure
exports.localAuth = function(username, password) {
	var deferred = Q.defer();

	MongoClient.connect(mongodbUrl, function(err, db) {
		var collection = db.collection('localUsers');

		collection.findOne({'username' : username})
			.then(function(result) {
				if(null == result) {
					console.log("USERNAME NOT FOUND:", username);
					deferred.resolve(false);
				}
				else {
					var hash = result.password;
					console.log("FOUND USER: " + result.username);

					if(bcrypt.compareSync(password, hash)) {
						deferred.resolve(result);
					} else {
						console.log("AUTHENTICATION FAILED");
						deferred.resolve(false);
					}
				}
				db.close();
			});
		});

		return deferred.promise;
};
