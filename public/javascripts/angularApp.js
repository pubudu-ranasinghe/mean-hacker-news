var app = angular.module('hackerNews', ['ui.router']);

app.config([
	'$stateProvider',
	'$urlRouterProvider',
	function($stateProvider, $urlRouterProvider){
		$stateProvider
			.state('home', {
				url: '/home',
				templateUrl: '/home.html',
				controller: 'MainCtrl',
				resolve: {
					postPromise: ['posts', function(posts) {
						return posts.getAll();
					}]
				}
			})
			.state('posts', {
				url: '/posts/{id}',
				templateUrl: '/posts.html',
				controller: 'PostsCtrl',
				resolve: {
					post: ['$stateParams', 'posts', function($stateParams, posts) {
						return posts.get($stateParams.id);
					}]
				}
			});
		$stateProvider
			.state('login', {
				url: '/login',
				templateUrl: '/login.html',
				controller: 'AuthCtrl',
				onEnter: ['$state', 'auth', function($state, auth) {
					if(auth.isLoggedIn()) { $state.go('home'); }
				}]
			})
			.state('register', {
				url: '/register',
				templateUrl: '/register.html',
				controller: 'AuthCtrl',
				onEnter: ['$state', 'auth', function($state, auth) {
					if(auth.isLoggedIn()) { $state.go('home'); }
				}]
			});

		$urlRouterProvider.otherwise('home');
	}]);

app.factory('posts', ['$http', 'auth', function($http, auth){
	var o = {
		posts: []
	};
	
	o.getAll = function() {
		return $http.get('/posts').then(function(response) {
			angular.copy(response.data, o.posts);
		});
	};

	o.create = function(post) {
		return $http.post('/posts', post, {
			headers: { Authorization: 'Bearer ' + auth.getToken() }
		}).then(function(response) {
			o.posts.push(response.data);
		});
	};

	o.upvote = function(post) {
		return $http.put('/posts/' + post._id + '/upvote', null, {
			headers: { Authorization: 'Bearer ' + auth.getToken() }
		}).then(function(response) {
			post.upvotes += 1;
		});
	};

	o.get = function(id) {
		return $http.get('/posts/' + id).then(function(response) {
			return response.data;
		});
	};

	o.addComment = function(id, comment) {
		return $http.post('/posts/' + id + '/comments', comment, {
			headers: { Authorization: 'Bearer ' + auth.getToken() }
		});
	};

	o.upvoteComment = function(post, comment) {
		return $http.put('/posts/' + post._id + '/comments/' + comment._id + '/upvote', null, {
			headers: { Authorization: 'Bearer ' + auth.getToken() }
		}).then(function(response) {
			comment.upvotes += 1;
		});
	};

	return o;
}]);

app.factory('auth', ['$http', '$window', function($http, $window) {
	var auth = {};

	auth.saveToken = function(token) {
		$window.localStorage['hacker-news-token'] = token;
	};

	auth.getToken = function() {
		return $window.localStorage['hacker-news-token'];
	};

	auth.isLoggedIn = function() {
		var token = auth.getToken();

		if(token) {
			var payload = JSON.parse($window.atob(token.split('.')[1]));
			return payload.exp > Date.now() / 1000;
		} else {
			return false;
		}
	};

	auth.currentUser = function() {
		if(auth.isLoggedIn()) {
			var token = auth.getToken();
			var payload = JSON.parse($window.atob(token.split('.')[1]));

			return payload.username;
		}
	};

	auth.register = function(user) {
		return $http.post('/register', user).then(function(response) {
			console.log(response);
			auth.saveToken(response.data.token);
		});
	};

	auth.login = function(user) {
		return $http.post('/login', user).then(function(response) {
			auth.saveToken(response.data.token);
		});
	};

	auth.logout = function() {
		$window.localStorage.removeItem('hacker-news-token');
	};

	return auth;
}]);

app.controller('MainCtrl', [
	'$scope',
	'posts',
	'auth',
	function($scope, posts, auth){
		$scope.test = 'Hello World!';
		$scope.posts = posts.posts;
		$scope.addPost = function(){
			if(!$scope.title || $scope.title === '') { return; }
			posts.create({
				title: $scope.title,
				link: $scope.link
			});
			$scope.title = '';
			$scope.link = '';
		};
		$scope.incrementUpvotes = function(post){
			posts.upvote(post);
		};
		$scope.isLoggedIn = auth.isLoggedIn;
	}
]);

app.controller('PostsCtrl', [
	'$scope',
	'posts',
	'post',
	function($scope, posts, post){
		$scope.post = post;
		$scope.addComment = function(){
			if(!$scope.body || $scope.body === '') { return; }
			posts.addComment(post._id, {
				body: $scope.body,
				author: 'user'
			}).then(function(comment) {
				$scope.post.comments.push(comment.data);
			});
			$scope.body = '';
		}
		$scope.incrementUpvotes = function(comment){
			posts.upvoteComment(post, comment);
		};
	}
]);

app.controller('AuthCtrl', [
	'$scope',
	'$state',
	'auth',
	function($scope, $state, auth) {
		$scope.user = {};

		$scope.register = function() {
			auth.register($scope.user).then(function() {
				$state.go('home');
			}, function(error) {
				$scope.error = error;
			});
		};

		$scope.login = function() {
			auth.login($scope.user).then(function() {
				$state.go('home');
			}, function(error) {
				$scope.error = error;
			});
		};
	}
]);

app.controller('NavCtrl', [
	'$scope',
	'auth',
	function($scope, auth) {
		$scope.isLoggedIn = auth.isLoggedIn;
		$scope.currentUser = auth.currentUser;
		$scope.logout = auth.logout;
	}
]);