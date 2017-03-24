var app = angular.module("PhotoGallery", []); 
app.controller("HomeCtrl", function($scope) {
	
	var CLIENT_ID = 'sbr5of2sbx8zzvg'; //Dropbox app key
    var dbx = new Dropbox({ clientId: CLIENT_ID });
    var authUrl = dbx.getAuthenticationUrl('https://benjaminBeganovic.github.io/gallery.html');//redirect link
	
	$scope.goToDropbox = function () {
			
			window.open(authUrl,"_self");

        };
	
});