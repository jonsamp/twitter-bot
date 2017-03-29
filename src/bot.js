'use strict'
// Dependencies =========================
const Twit = require('twit')
const ura = require('unique-random-array')
const config = require('./config')
const strings = require('./helpers/strings')
const sentiment = require('./helpers/sentiment')

const Twitter = new Twit({
	consumer_key: config.twitter.consumerKey,
	consumer_secret: config.twitter.consumerSecret,
	access_token: config.twitter.accessToken,
	access_token_secret: config.twitter.accessTokenSecret
})

// Frequency
const favoriteFrequency = config.twitter.favorite
//  username
const username = config.twitter.username

// RANDOM QUERY STRING  =========================

let qs = ura(strings.queryString)
let qsSq = ura(strings.queryStringSubQuery)
let rt = ura(strings.resultType)

// https://dev.twitter.com/rest/reference/get/search/tweets
// A UTF-8, URL-encoded search query of 500 characters maximum, including operators.
// Queries may additionally be limited by complexity.

// FAVORITE BOT====================

// find a random tweet and 'favorite' it
var favoriteTweet = function() {
	var paramQS = qs()
	paramQS += qsSq()
	var paramRT = rt()
	var params = {
		q: paramQS + paramBls(),
		result_type: paramRT,
		lang: 'en'
	}

	// find the tweet
	Twitter.get('search/tweets', params, function(err, data) {
		if (err) {
			console.log(`ERR CAN'T FIND TWEET:`, err)
		} else {
			// find current tweets
			var currentStatuses = data.statuses.filter(function(status) {
		       return /2017/.test(status.created_at)
		     });
		
			var tweet = currentStatuses
			var randomTweet = ranDom(tweet) // pick a random tweet
			
			// if random tweet exists
			if (typeof randomTweet !== 'undefined') {
				// run sentiment check ==========
				// setup http call
				var httpCall = sentiment.init()
				var favoriteText = randomTweet['text']

				httpCall.send('txt=' + favoriteText).end(function(result) {
					var sentim = result.body.result.sentiment
					var confidence = parseFloat(result.body.result.confidence)
					// if sentiment is Negative and the confidence is above 75%
					if (sentim === 'Negative' && confidence >= 75) {
						console.log('Did not favorite tweet due to negativity: ', sentim, favoriteText)
						return
					} else {
					  // Tell TWITTER to 'favorite'
				Twitter.post('favorites/create', {
					id: randomTweet.id_str
				}, function(err, response) {
					// if there was an error while 'favorite'
					if (err) {
						console.log('CANNOT BE FAVORITE... Error: ', err, ' Query String: ' + paramQS)
					} else {
					  console.log("Favorited: @" + response.user.screen_name + ": " + response.text + ", (" + response.user.created_at + ")");
					}
				})
					}
				})
			} else {
        console.log('No tweet found.')
        return;
      }
		}
	})
}

// favorite on bot start
favoriteTweet()
// favorite in every x minutes
setInterval(favoriteTweet, 1000 * 60 * favoriteFrequency)

// function to generate a random tweet tweet
function ranDom(arr) {
	var index = Math.floor(Math.random() * arr.length)
	return arr[index]
}

function paramBls() {
	var ret = ''
	var arr = strings.blockedStrings
	var i
	var n
	for (i = 0, n = arr.length; i < n; i++) {
		ret += ' -' + arr[i]
	}
	return ret
}