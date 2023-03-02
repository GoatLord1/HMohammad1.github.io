// -- TODO --
//  1. create account function
//  2. login function
//  3. logout function
//  4. update pfp function
//  5. update bio function
//  6. update display name function
//  6. update settings functions



// import user + profile objects
var User = require ('../objects/user.js');
var Profile = require ('../objects/profile.js');

const userDAO = require ('../DAOs/userDAO.js');
const { res } = require('express');
const session = require("express-session");

// hashing library and function
const bcrypt = require("bcryptjs");
function hashPassword(password, callback) {
    //set the complexity of the salt generation
    const saltRounds = 10;
    //generate random salt (to be added to the password to generate random hash)
    bcrypt.genSalt(saltRounds, function(err, salt) {
        if (err) {
            throw err;
        } else {
            //hash the password using the generated salt
            bcrypt.hash(password, salt, function(err, hash) {
                if (err) {
                    throw err;
                } else {
                    //return the computed hash
                    callback(err, hash);
                }
            });
        }
    });
}

function generateUserID(){

    
}

const createAccount = (req, res) => {

    // check passwords match
    if (req.fields.pw1 != req.fields.pw2){
        console.log(`Password mismatch`);
        res.render("signup", {passwordError: true, message: "Passwords do not match"});
    }

    try{
        // check if email already exists in DB
        userDAO.emailExists(req.fields.email, function(err, result){
            if(result){
                console.log(`Email: ${req.fields.email} is already in use`);
                return res.render("signup", {emailError: true, message: "This email is already linked to a Scrapmap account. <a href='/login'> Log-in here! </a>"});
            }
            else if(err){
                throw err;
            }
            else{
                // check if username is already taken
                userDAO.usernameExists(req.fields.username, function(err, result){
                    if(result){
                        console.log(`Username: ${req.fields.username} is already in use`);
                        return res.render("signup", {usernameError: true, message: "This username is already taken."});
                    }
                    else if(err){
                        throw err;
                    }
                    else{

                        // hash password -- callback prevents async errors
                        hashPassword(req.fields.pw1, function(err, hash){

                            if(!err){
                                // generate a random userID
                                var userID;
                                var count = 1;
                                do{
                                    userID = Math.floor(Math.random() * 2147483646);
                                    userDAO.userIDexists(userID, function(err, rows){
                                        if(err){
                                            throw err;
                                        }
                                        count = rows.count;
                                    })
                
                                } while(count != 1);
                                
                                // inputs validated so start inserts
                                userDAO.insertLogin(userID, req.fields.username, req.fields.email, hash, function(err, result){
                                    if(!result){
                                        throw err;
                                    }
                                    else{
                                        userDAO.insertProfile(userID, req.fields.disp_name, req.fields.fname, req.fields.lname, function(err, result){
                                            if(!result){
                                                throw err;
                                            }
                                            else{
                                                userDAO.insertPFP(userID, function(err, result){
                                                    if(!result){
                                                        throw err;
                                                    }
                                                    else{
                                                        // retrive full user data from server
                                                        getUserByID(userID, function(user){
                                                            // bind user to session
                                                            req.session.user = user;
                                                            req.session.save();

                                                            // returns output as string
                                                            //res.send(JSON.stringify(user));
                                                            res.render("application", {user: user});
                                                        });
                                                    }
                                                });
                                            };
                                        });
                                    };
                                });
                            };
                        });
                    }
                });
            }
        });
    }
    catch(err){ 
        console.log(err);
        return res.render("application", {serverError: true, message: "Oops something went wrong. Please try again later."});
    }
}

// returns a populated user object complete with profile -- if just a profile is needed user getProfile functions
function getUserByID(userID, callback){


    try{
        // fetch row from DB
        userDAO.getUserByID(userID, function(err, data){
            if(err){
                throw err;
            }

            // create profile
            var profile = new Profile(data.username, data.display, data.fname, data.lname, data.pfp, data.colour);
            // create user object
            var user = new User(userID, data.email, profile);
            return callback(user);
        });
    }
    catch{
        return callback(false);
    }



}

// return a user profile from their ID
function getProfileByID(userID, callback){

    try{
        // fetch row from DB
        userDAO.getProfileByID(userID, function(err, data){
            // create profile
            var profile = new Profile(data.username, data.display, data.fname, data.lname, data.pfp, data.colour);
            return callback(profile);
        });
    }
    catch{
        return callback(false);
    }


}


const fetchHash = (res, ID, callback) => {
    if(ID.includes("@")){
        userDAO.fetchPaswordByEmail(ID, function(err, result){
            if(!result){
                console.log("email doesn't exist");
                return res.render("index", {IDerror: true, message: "There is no Scrapmap account linked to this email."})
            }
            else{
                return callback(result);
            }
        });
    }
    else{
        userDAO.fetchPaswordByUsername(ID, function(err, result){
            if(!result){
                console.log("UN doesn't exist");
                return res.render("index", {IDerror: true, message: "There is no Scrapmap account with this username."})
            }
            else{
                return callback(result);
            }
        });
    }

}

// login using an identifier and a password
const login = (req, res) => {

    // check if identifier is a username or an email
    ID = req.fields.ID;
    fetchHash(res, ID, function(result){

        // hash entered pw and compare to the one from the DB
        bcrypt.compare(req.fields.pw, result.hash, function(err, match){
            if(err){
                return res.render("index", {serverError: true, message: "Oops something went wrong. Please try again later..."});
            }
            // if passwords don't match
            else if(!match){
                return res.render("index", {pwError: true, message: "Incorrect password."});
            }
            // passwords match
            else if(match){
                // get user object from the DB
                getUserByID(result.userID, function(user){
                    console.log("Login success");
                    // bind user to current session
                    req.session.user = user;
                    req.session.save();
                    //res.send(JSON.stringify(user));
                    res.render("application", {user: user});

                });
            }

        });
    });

}

// destroy the current session and return to index
const logout = (req, res) =>{

    req.session.destroy();
    // send back to index
    return res.render("index");

}


// sends a friend request from the current session user using userIDs
const sendFriendRequest = (req, res) => {

    // check user is logged in
    if(req.session.user === undefined){
        return res.send("You must be logged in to send a friend request");
    }

    var userID = req.session.user.userID;
    var sendTo = req.params.sendTo;
    
    userDAO.insertFriendRequest(userID, sendTo, function(result){

        if(result){
            res.send("Request succesfully sent");
        }
        else{
            throw err;
        }

    });

    


}

// accepts / declines an existing friend request
const updateFriendRequest = (req, res) =>{

        // check user is logged in
        if(req.session.user === undefined){
            return res.send("You must be logged in to update a friend request");
        }
    
        var reqID = req.fields.reqID;
        var status = req.fields.status;
        
        userDAO.updateFriendRequest(reqID, status, function(result){
    
            if(result){
                res.send("Request succesfully updated");
            }
            else{
                throw err;
            }
    
        });

}

// removes another user from the current session users friends list
const removeFriend = (req, res) =>{
        // check user is logged in
        if(req.session.user === undefined){
            return res.send("You must be logged in to remove a friend");
        }
    
        var userID = req.session.user.userID;
        var toRemove = req.params.remove;
        
        userDAO.updateFriendRequest(userID, toRemove, function(result){
    
            if(result){
                res.send(`User #${toRemove} removed from your friends list`);
            }
            else{
                throw err;
            }
    
        });
}


// returns an array of profiles that correspond to all the current user's friends
const getFriendProfiles = (req,res) =>{

    // check user is logged in
    if(req.session.user === undefined){
        return res.send("You must be logged in.");
    }

    var userID = req.session.user.userID;
    
    userDAO.fetchAllFriendIDs(userID, function(err, rows){

        if(!err){

            // init array
            var friendProfiles = [];

            // for each returned ID fetch the corresponding profile
            rows.forEach(row => {

                // get the profile
                getProfileByID(row.userID, function(profile){
                    // only push successfully retrieved profiles
                    if(profile){
                       
                        friendProfiles.push(profile);

                    }
                });
            });

            // return populated friend array
            res.send(JSON.stringify(friendProfiles));

        }
        else{
            throw err;
        }

    });


}


// export member functions for use elsewhere
module.exports = {

    createAccount,
    login,
    logout,
    getUserByID,
    getProfileByID,
    sendFriendRequest,
    updateFriendRequest,
    removeFriend,
    getFriendProfiles
    

}