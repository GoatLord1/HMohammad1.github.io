const { query } = require("express");
const DB = require("./queryHandler");

// creates a profile for the given userID
function insertProfile(userID, d_n, fname, lname, callback){

    let query = "INSERT INTO user_profiles (userID, display_name, fname, lname) VALUES (?,?,?,?)";
    let params = [userID, d_n, fname, lname];

    DB.executeQuery(query, params, function(err, rows){
        if(err){
            return callback(err, false);
        }
        else{
            return callback(null, true);
        }
    });

}

// insert login details -- returns true on success
function insertLogin(userID, username, email, hash, callback){

    let query = "INSERT INTO user_logins (userID, username, email, hash) VALUES (?,?,?,?)";
    let params = [userID, username, email, hash];

    DB.executeQuery(query, params, function(err, rows){
        if(err){
            return callback(err, false)
        }
        else{
            return callback(null, true);
        }
    });

}

// assign default pfp
function insertPFP(userID, callback){

    let query = "INSERT INTO user_pfp (userID) VALUES (?)";
    let params = [userID];

    DB.executeQuery(query, params, function(err, rows){
        if(err){
            return callback(err, false);
        }
        else{
           return callback(null, true);
        }
    });

}


// links the current IP of a user to their account
function logIP(userID){



}


// return true if email exists
function emailExists(email, callback){

    let query = "SELECT count(userID) AS count FROM user_logins WHERE email = ?";
    let params = [email];

    DB.executeQuery(query, params, function(err, rows, fields){
        if(!err){
            if(rows[0].count == 0){
                return callback(null, false)
            }
            else{
                return callback(null, true);
            }
        }
        // connection / query failed -- throw error
        else{
            return callback(err, null);
        }

    });
}

function usernameExists(username, callback){

    let query = "SELECT count(userID) AS count FROM user_logins WHERE username = ?";
    let params = [username];

    DB.executeQuery(query, params, function(err, rows, fields){

        if(!err){
            if(rows[0].count == 0){
                return callback(null, false);
            }
            else{
                return callback(null, true);
            }
        }
        else{
            return callback(err, null);
        }

    });

}

function userIDexists(userID){

    let query = "SELECT count(userID) AS count FROM user_logins WHERE userID = ?";
    let params = [userID];

    DB.executeQuery(query, params, function(err, rows, fields){

        if(!err){
            if(rows[0].count == 0){
                return false;
            }
            else{
                return true;
            }
        }
        else{
            throw(err);
        }
    });


}


function fetchPaswordByEmail(email, callback){

    let query = `SELECT userID, hash FROM user_logins WHERE email = ?`;
    let params = [email];

    DB.executeQuery(query, params, function(err, rows, fields){
        if(!err){
            // if empty set returned username doesn't exist
            if(rows.length == 0){
                return callback(false)
            }
            else{
                return callback(rows[0]);
            }
        }
        else{
            throw err;
        }
    });

}

function fetchPaswordByUsername(username, callback){

    let query = `SELECT userID, hash FROM user_logins WHERE username = ?`;
    let params = [username];

    DB.executeQuery(query, params, function(err, rows, fields){
        if(!err){
            // if empty set returned username doesn't exist
            if(rows.length == 0){
                callback(false);
            }
            else{
                callback(rows[0]);
            }
        }
        else{
            throw err;
        }
    });

}

// returns all data for a user -- use getProfileByID to fetch user side details
function getUserByID(userID, callback){

    let query = `
        SELECT  user_logins.username AS username,
                user_logins.email AS email,
                user_profiles.display_name AS display,
                user_profiles.fname AS fname,
                user_profiles.lname AS lname,
                user_profiles.colour AS colour,
                user_pfp.link AS pfp
        FROM user_logins
        INNER JOIN user_profiles ON user_logins.userID = user_profiles.userID
        INNER JOIN user_pfp ON user_logins.userID = user_pfp.userID
        WHERE user_logins.userID = ?    
        `;
    let params = [userID];

    DB.executeQuery(query, params, function(err, rows, fields){

        if(!err){
            return callback(rows[0]);
        }
        else{

            throw err;
        }
    });
}


module.exports = {

    getUserByID,
    fetchPaswordByEmail,
    fetchPaswordByUsername,
    emailExists,
    usernameExists,
    userIDexists,
    insertLogin,
    insertProfile,
    insertPFP
}