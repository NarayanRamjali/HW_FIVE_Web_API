/**
 * Created by narayanthapa on 4/02/17.
 */

'use strict';

var usergrid = require('usergrid');

var _ = require('lodash');

var apigee = require('apigee-access');

var UsergridClient = require('../../node_modules/usergrid/lib/client');
var Usergrid = new UsergridClient({
    "appId": "sandbox",
    "orgId": "rsmjsli1991",
    "authMode": "NONE",
    "baseUrl": "https://apibaas-trial.apigee.net",
    "URI": "https://apibaas-trial.apigee.net",
    "clientId": "b3U6D8wqzyC0EeeiwhIuBzeXfQ",
    "clientSecret": "b3U6mhSfE1BUh5UWdha8fiYLfPsFnn0"
});

module.exports = {

    getHello: getHello,
    getMovies: getMovies,
    postMovie: postMovie,
    getMovieID: getMovieID,
    putMovieID: putMovieID,
    delMovieID: delMovieID,
    addReview: addReview,
    delReview: delReview
};

function getHello(req, res) {
    // variables defined in the Swagger document can be referenced using req.swagger.params.{parameter_name}
    var name = req.swagger.params.name.value || 'stranger';
    var hello = util.format('Hello, %s!', name);

    // this sends back a JSON response which is a single string
    res.json(hello);
}

//getting all the movies that are listed
function getMovies (req,res)
{
    Usergrid.GET('movies', function(err, response, movie)
    {
        if(err){res.json({error: err});}
        else
        {
            console.log(response.entities);
            res.json({movies: response.entities}).end();
        }
    })
}

//creating a new movie to be inserted
function postMovie (req,res)
{
    var movies = req.swagger.params.movie.value.movie;
    _.assign(movies,{type: 'movie'});
    if(_.isUndefined(movies.actors))
        res.json({Error: "Undefined Actor"});
    else if(_.isUndefined(movies.name))
        res.json({Error: "Undefined Title"});
    else if(_.isUndefined(movies.year))
        res.json({Error: "Undefined Year"});
    else if(_.isUndefined(movies.ID))
        res.json({Error: "Undefined ID"});
    else
        Usergrid.POST(movies, function (err, response, movie)
        {
            if (err) {res.json({message: err});}
            else
            {
                movie.save(Usergrid, function (err)
                {
                    if (err) {res.status(500).json(err).end();}
                    else res.json({message: 'A movie have successfully added', movie: response}).end();
                });
            }
        })
}

//getting the movie when the ID is entered
function getMovieID (req,res)
{
    var uuid = req.swagger.params.ID.value;
    var reviews = req.swagger.params.reviews.value;
    Usergrid.GET('movies',uuid, function(error, usergridResponse, movie)
    {
        if (error){
            res.json({error: error});
        }
        else
        if (!reviews) {
            res.json({
                movie: usergridResponse
            }).end();
        }
        else{
            var options = {
                path:"reviews",
                //searches reviews by movie name
                ql: "movie = '"+movie.name+"'"
            };
            Usergrid.GET(options, function(error, usergridResponse2) {
                res.json({
                    movie: usergridResponse,
                    reviews: usergridResponse2.entities
                }).end();
            })
        }
    })
}

//updating s movie with the ID is entered
function putMovieID(req,res)
{
    var uuid = req.swagger.params.ID.value;
    Usergrid.GET('movies', uuid, function(error, usergridResponse, movie)
    {
        _.assign(movie, req.swagger.params.movie.value.movie);
        _.assign(movie, {type: 'movie'});
        Usergrid.PUT(movie, {uuid : uuid}, function (err, usergridResponse)
        {
            if(err){res.json({error: err});}
            else {res.json({message: 'movie successfully updated', movie: usergridResponse})}
        });
    })
}

//deleting s movie with the ID is entered
function delMovieID(req,res)
{
    var uuid = req.swagger.params.ID.value;
    Usergrid.DELETE('movies',uuid, function(error, usergridResponse)
    {
        if (error) {res.json({error: error});}
        else res.json({message: 'movie successfully deleted', movie: usergridResponse}).end();
    })
}

//adding the review to the movie
function addReview (req,res)
{
    var review = req.swagger.params.review.value;

    _.assign(review, {type: 'review'});

    Usergrid.GET("movies", req.swagger.params.ID.value, function(error, usergridResponse, movie) {
        if (!error){
            var movietitle = movie.name;
            //give movie name to review, only if movie exists already
            _.assign(review, {movie: movietitle});
            if(_.isUndefined(review.movie))
                res.json({ Error: "Undefined movie."});
            else if(_.isUndefined(review.score))
                res.json({ Error: "Undefined movie score." });
            else if(_.isUndefined(review.review))
                res.json({ Error: "Undefined movie review text." });

            else Usergrid.POST(review, function (err, response, review) {
                    if (err) {
                        res.json({message: err});
                    }
                    else {
                        review.save(Usergrid, function (err) {

                            if (err) {
                                res.status(500).json(err).end();
                            }
                            else res.json({
                                message: 'Review has been successfully added',
                                review: response
                            }).end();
                        });
                    }
                })
        }
        else
            res.json({error: error});
    });
}

//deleting the review
function delReview(req,res){

    var uuid = req.swagger.params.ID.value;
    Usergrid.DELETE('reviews',uuid, function(error, usergridResponse) {
        if (error) {
            res.json({error: error});
        }
        else res.json({message: 'Review has been successfully removed', movie: usergridResponse}).end();
    })
}