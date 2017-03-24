var app = angular.module("PhotoGallery", []);
app.controller("GalleryCtrl", function($scope) {
	
	//get token from authentication url
	var dropboxToken = utils.parseQueryString(window.location.hash).access_token;
	
	//is it authorized or not
	if(dropboxToken == null || dropboxToken == "")
		document.getElementById("galleryTitle").innerHTML = "You are not authorized!";
	else
		document.getElementById('uploadView').style.display = 'block';	
	
    var paths = []; //array of the file paths
    var tmpPic = 0; //current photo
    var numOfPic = 0; //number of photos 	
	
	//downloads all file paths/names from dropbox app folder
    $scope.downloadFPaths = function() {

        var xhr = new XMLHttpRequest();
        xhr.onload = function() {
            if (xhr.status === 200) {

                obj = JSON.parse(xhr.response);
                paths = [];
                titles = [];
                for (i = 0; i < obj.entries.length; i++) {
                    paths.push(obj.entries[i].path_lower);
                    titles.push(obj.entries[i].path_lower.substring(1, obj.entries[i].path_lower.length));
                }
                numOfPic = obj.entries.length;

                if (numOfPic > 0) {
					
                    $scope.downloadFiles();
                    document.getElementById('photoView').style.display = 'block';
                    document.getElementById('listPhoto').style.display = 'block';
                    var tmp = "Gallery (" + numOfPic + " photo";
                    tmp += (numOfPic > 1) ? "s)" : ")";
                    document.getElementById("galleryTitle").innerHTML = tmp;
					
                } else {
					
                    document.getElementById('photoView').style.display = 'none';
                    document.getElementById('listPhoto').style.display = 'none';
                    document.getElementById("galleryTitle").innerHTML = "Your gallery is empty!";
                }

                var myJsonString = JSON.parse(JSON.stringify(titles));
                $scope.listOfTitles = myJsonString;
                $scope.$apply();

            } else {
                var errorMessage = xhr.response || 'Unable to download file';
                console.log(xhr.response);
            }
        };
        xhr.open('POST', 'https://api.dropboxapi.com/2/files/list_folder');
        xhr.setRequestHeader('Authorization', 'Bearer ' + dropboxToken);
        xhr.setRequestHeader("Content-type", 'application/json');
        var data = '{ "path": "", "recursive": false, "include_media_info": false, "include_deleted": false, "include_has_explicit_shared_members": false }';
        xhr.send(data);
    };
    $scope.downloadFPaths();

	//download a particular file/photo pointed by tmpPic
    $scope.downloadFiles = function() {

        var xhr = new XMLHttpRequest();
        xhr.responseType = 'arraybuffer';

        xhr.onload = function() {
            if (xhr.status === 200) {

                var blob = new Blob([xhr.response], {
                    type: 'application/octet-stream'
                });
				
                var urlCreator = window.URL || window.webkitURL;
                var imageUrl = urlCreator.createObjectURL(blob);
                document.getElementById("imageId").src = imageUrl;
                var naslov = paths[tmpPic].substring(1, paths[tmpPic].length);
                document.getElementById("picTitle").innerHTML = naslov.charAt(0).toUpperCase() + naslov.slice(1);
                seekDisabled = false;
				
            } else {
                var errorMessage = xhr.response || 'Unable to download file';
                console.log(errorMessage);
            }
        };

        xhr.open('POST', 'https://content.dropboxapi.com/2/files/download');
        xhr.setRequestHeader('Authorization', 'Bearer ' + dropboxToken);
        xhr.setRequestHeader('Dropbox-API-Arg', JSON.stringify({
            path: paths[tmpPic]
        }));
        xhr.send();

    };
    
	//prevents further seek
	var seekDisabled = false;
	//next photo
    $scope.nextPic = function() {

        if (seekDisabled == true || numOfPic < 2)
            return;

        tmpPic = (tmpPic >= numOfPic - 1) ? 0 : tmpPic + 1;

        $scope.downloadFiles();
        document.getElementById("picTitle").innerHTML = "loading...";
        seekDisabled = true;
    };
	//previous photo
    $scope.previousPic = function() {

        if (seekDisabled == true || numOfPic < 2)
            return;

        tmpPic = (tmpPic <= 0) ? numOfPic - 1 : tmpPic - 1;

        $scope.downloadFiles();
        document.getElementById("picTitle").innerHTML = "loading...";
        seekDisabled = true;
    };
	
    var numberOfUploads = 0;
    var uploading = false;
	//clears last state
    $scope.clearUploaded = function() {
        if (uploading)
            return;
		
        document.getElementById("percentage").innerHTML = "";
        document.getElementById("photosForUpload").value = "";
        document.getElementById("uploadFile").value = "";
    };

    $scope.showSelectedFiles = function() {
        if (uploading)
            return;
		
        var listOfFiles = document.getElementById("photosForUpload").files;
        var odabrano = "";
        for (i = 0; i < listOfFiles.length; i++) {
            odabrano += listOfFiles[i].name + ",   ";
        }
        document.getElementById("uploadFile").value = odabrano.substring(0, odabrano.length - 4);
    };


    $scope.uploadFiles = function() {

        if (uploading)
            return;

        var tmp = document.getElementById("photosForUpload").value;
        if (tmp == null || tmp == "") {
            document.getElementById("percentage").innerHTML = "No files selected!";
            return;
        }

        uploading = true;

        var listOfFiles = document.getElementById("photosForUpload").files;

        for (i = 0; i < listOfFiles.length; i++) {

            var file = listOfFiles[i];

            var xhr = new XMLHttpRequest();

            xhr.upload.onprogress = function(evt) {
                var percentComplete = parseInt(100.0 * evt.loaded / evt.total);
                var percentage = "" + percentComplete + "%";
                document.getElementById("percentage").innerHTML = percentage;
            };

            xhr.onload = function() {
                if (xhr.status === 200) {
                    var fileInfo = JSON.parse(xhr.response);

                    numberOfUploads++;

                    if (numberOfUploads == listOfFiles.length) {
                        document.getElementById("percentage").innerHTML = "Completed!";
                        document.getElementById("photosForUpload").value = "";
                        numberOfUploads = 0;
                        uploading = false;
                        document.getElementById("uploadFile").value = "";
                        $scope.downloadFPaths();
                    }
                } else {
                    var errorMessage = xhr.response || 'Unable to upload file';
					console.log(errorMessage);

                    numberOfUploads++;

                    if (numberOfUploads == listOfFiles.length) {
                        document.getElementById("percentage").innerHTML = "Upload failed!";
                        document.getElementById("photosForUpload").value = "";
                        numberOfUploads = 0;
                        uploading = false;
                        document.getElementById("uploadFile").value = "";
                        $scope.downloadFPaths();
                    }
                }
            };

            xhr.open('POST', 'https://content.dropboxapi.com/2/files/upload');
            xhr.setRequestHeader('Authorization', 'Bearer ' + dropboxToken);
            xhr.setRequestHeader('Content-Type', 'application/octet-stream');
            xhr.setRequestHeader('Dropbox-API-Arg', JSON.stringify({
                path: '/' + file.name,
                mode: 'add',
                autorename: true,
                mute: false
            }));
            xhr.send(file);
        }
    };
	
	//delete selected file
    $scope.deleteFile = function(title) {

        if (titles[tmpPic] == title)
            $scope.previousPic();

        var xhr = new XMLHttpRequest();
        xhr.onload = function() {
            if (xhr.status === 200) {

                $scope.downloadFPaths();

            } else {
                var errorMessage = xhr.response || 'Unable to download file';
                console.log(xhr.response);
            }
        };
        xhr.open('POST', 'https://api.dropboxapi.com/2/files/delete');
        xhr.setRequestHeader('Authorization', 'Bearer ' + dropboxToken);
        xhr.setRequestHeader("Content-type", 'application/json');
        var data = '{ "path": "/' + title + '" }';
        xhr.send(data);

    };
	
    var user_info;
	//retrieve user/account info
    $scope.account_info = function() {

        var xhr = new XMLHttpRequest();
        xhr.onload = function() {
            if (xhr.status === 200) {

                user_info = JSON.parse(xhr.response);
                document.getElementById("userName").innerHTML = user_info.display_name;
                document.getElementById("userProfile").href = user_info.referral_link;

            } else {
                var errorMessage = xhr.response || 'Unable to download file';
                console.log(xhr.response);
            }
        };
        xhr.open('GET', 'https://api.dropboxapi.com/1/account/info');
        xhr.setRequestHeader('Authorization', 'Bearer ' + dropboxToken);
        xhr.setRequestHeader("Content-type", 'application/json');
        xhr.send();

    };
    $scope.account_info();
	
	//write json in a file on disk
    $scope.downloadJsonList = function() {

        var data = user_info;
        var filename = user_info.display_name + '.json';
		
		//creates a list of photos owned by user
        var string_obj = '{ "photos" : [';
        for (i = 0; i < titles.length; i++) {

            string_obj += '{ "filename":"' + titles[i] + '"}';
            if (i < titles.length - 1)
                string_obj += ',';
        }
        string_obj += ']}';
		//convert list to json
        var objListOfPhotos = JSON.parse(string_obj);
		//merge user info with list of photos
        var data = Object.assign({}, data, objListOfPhotos);
		//convert again to string
        data = JSON.stringify(data, undefined, 2);
		//convert to blob
        var blob = new Blob([data], {
            type: 'text/json'
        });
		//for IE
        if (window.navigator && window.navigator.msSaveOrOpenBlob) {
            window.navigator.msSaveOrOpenBlob(blob, filename);
        } else {
			//manually make event for download
            var e = document.createEvent('MouseEvents'),
                a = document.createElement('a');
            a.download = filename;
            a.href = window.URL.createObjectURL(blob);
            a.dataset.downloadurl = ['text/json', a.download, a.href].join(':');
            e.initEvent('click', true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
            a.dispatchEvent(e);
        }
    };

});