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
			});
		$stateProvider
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
		$urlRouterProvider.otherwise('home');
	}]);

app.factory('posts', ['$http', function($http){
	var o = {
		posts: []
	};
	
	o.getAll = function() {
		return $http.get('/posts').then(function(response) {
			angular.copy(response.data, o.posts);
		});
	};

	o.create = function(post) {
		return $http.post('/posts', post).then(function(response) {
			o.posts.push(response.data);
		});
	};

	o.upvote = function(post) {
		return $http.put('/posts/' + post._id + '/upvote').then(function(response) {
			post.upvotes += 1;
		});
	};

	o.get = function(id) {
		return $http.get('/posts/' + id).then(function(response) {
			return response.data;
		});
	};

	o.addComment = function(id, comment) {
		return $http.post('/posts/' + id + '/comments', comment);
	};

	o.upvoteComment = function(post, comment) {
		return $http.put('/posts/' + post._id + '/comments/' + comment._id + '/upvote').then(function(response) {
			comment.upvotes += 1;
		});
	};

	return o;
}]);

app.controller('MainCtrl', [
	'$scope',
	'posts',
	function($scope, posts){
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
}]);