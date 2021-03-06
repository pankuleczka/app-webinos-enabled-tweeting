function InitGUI(){
	
	setTimeout(checkDeletion, 3000);
	
	$("#tbox").maxinput({
		position	: 'topleft',
		showtext 	: true,
		limit		: 140
	});
	
	$('#btnSubmit').bind('click', function(){
		if (!LastTVStatus.name.length){
		    // Tweet Message only
			TwitterHelper.API.tweetMessage(
				$('#tbox').find("textarea").val(),
				function(){GUI.showSuccess('Tweet message successful'); $('#tbox').find("textarea").val('');},
				function(){GUI.showError('Tweet message unsuccessful'); alert("error");}
			);
		}else{
			// Tweet Message with media
			console.log('------------------------------------------------------');
			console.log(LastTVStatus.name);
			console.log(LastTVStatus.image);
			console.log('------------------------------------------------------');
			var imgdata = LastTVStatus.image.substring("data:image/png;base64,".length); // TODO: We should know what type this image is
			TwitterHelper.API.tweetWithImage(
					GetTwitterBox().val(),
					LastTVStatus.name.replace(" ","_")+".png",// TODO: We should know what type this image is
					imgdata,
					function(){GUI.showSuccess('Tweet with image successful')},
					function(){GUI.showError('Tweet with image unsuccessful')}
			);
		}

		var dest = "";
		for(var i=0;i<usrEmails.length;i++){
			if(usrEmails[i].verified == true) {
				console.log("contact " + usrEmails[i].name + " will be emailed to: " + usrEmails[i].address);
				dest = usrEmails[i].address + "," + dest;
			}
		}

		var subject = "forwarded tweet from Webinos Enabled Tweeting (Webninos application)";
		var body = "This message has been automatically generated by Webinos Enabled Tweeting Application. You've been addressed by the following tweet: \'" + $('#tbox').find("textarea").val() + "\'";
		var link = "mailto:" + escape(dest) +
			       "?subject=" + escape(subject) +
			       "&body=" + escape(body);
		if(dest.lastIndexOf('@') != -1)	//check if the mailing list it's not empty
			window.location.href = link;
		//TODO: to be substituted with  Message API createMessage(short type) and PendingOperation sendMessage(SuccessCallbackSuccessCallbackSuccessCallback successCallback, ErrorCallbackErrorCallbackErrorCallback errorCallback, Message message)
		GUI.showSuccess("Email successfully sent!!");
		
				
	});
//	tweetWithImage: function(text,imageName,imageBytes, successCB, errorCB){
}

function GetTwitterBox(){
	return $('#tbox').find("textarea");
}



TwitterHelper = {

	localPzpAddress: null,
	isReady: false, // TODO: Check if service is ready before calling staff...
	oAuthService: null,
	init: function(message){
        //new way to generate sessionID
        sessionID = webinos.session.getPZPId();
        console.log('----------SessionID:' + sessionID);
        isAlreadyAuthenticated();
        
		/*// Keep track of the local device address						
		webinos.ServiceDiscovery.findServices(new ServiceType('http://webinos.org/api/events'), {
		  onFound: function (service) {
			sessionID = service.myAppID.substring(0,service.myAppID.lastIndexOf('/'));
			console.log('SessionID:' + sessionID);
			isAlreadyAuthenticated();			
		  }});*/															
	},
	API: {
// 		getUsersInfo: function(ids, userHandlerCB){
// 			var baseRequest = "http://api.twitter.com/1/users/lookup.json?user_id=";
// 			//split the request into batches of 100 persons
// 			while (ids.length >0){
// 				var currentids;
// 				if (ids.length>100){
// 					currentids = ids.splice(0,100);
// 				} else {
// 					currentids = ids.splice(0,ids.length);
// 				}
// 				var request = baseRequest + currentids.join(",");
// 				TwitterHelper.oAuthService.get(request, TwitterHelper.Secrets.access_token, TwitterHelper.Secrets.access_token_secret, function(users){
// 					users = JSON.parse(users);
// 					jQuery.each(users,function(index, user){
// 						userHandlerCB(user);
// 					});
// 				});
// 			}
// 		},
		tweetMessage: function(text, successCB, errorCB){
		  
		    $.ajax({
			url: "http://130.192.85.173:8888/tweet",
			type: 'POST',
		// 		    $.ajax({
// 			url: "https://130.192.85.173:8888/logout",
// 			type: 'POST',
// 			data: JSON.stringify({"sessionID": sessionID}),				
// 			dataType: 'json',
// 
// 			success: function (data) {
// 			   TwitterHelper.isReady = false;
// 			   if(successCB) successCB(data);			   
// 			},
// 			error: function (data) {
// 			  TwitterHelper.isReady = false;
// 
// 			   if(errorCB) errorCB(data);
// 			   console.log("Error: " + JSON.stringify(data));
// 			}
// 		    }	
	     data: JSON.stringify({"sessionID": sessionID, "tweet": text}),				
			dataType: 'json',

			success: function (data) {
			   if(successCB) successCB(data);	
			},
			error: function (data) {
			   if(errorCB) errorCB(data);
			   console.log("Error: " + JSON.stringify(data));
			}
		    });
		  
		  
		},
		tweetWithImage: function(text,imageName,imageBytes, successCB, errorCB){
			//Body should be text due to Twitter's undocumented incompatibility with oAuth.
			//Posting with oAuth does not support multipart/form-data specification http://www.w3.org/TR/html4/interact/forms.html#h-17.13.4.2
			var body = "";
			var nl = "\r\n";
			
			body += "--CbotRul3z"+nl;
			//media[] as described in API doesn't work!
			//Using media_data instead based on http://stackoverflow.com/questions/7316776/twitters-statuses-update-with-media-on-ios-returns-500-error
			body += 'Content-Disposition: form-data; name="media_data[]"; filename="'+imageName+'"'+nl;
			body += 'Content-Transfer-Encoding: base64'+nl;
			body += 'Content-Type: image/png'+nl; // TODO: We should know what type this image is
			body += ''+nl;
			body += imageBytes+nl;
			
			body += "--CbotRul3z"+nl;
			body += 'Content-Disposition: form-data; name="status"'+nl;
			body += ''+nl;
			body += text+nl;
			
			body += "--CbotRul3z--";
			body += ''+nl;
			
			TwitterHelper.oAuthService.post("http://upload.twitter.com/1/statuses/update_with_media.json", TwitterHelper.Secrets.access_token, TwitterHelper.Secrets.access_token_secret, body, "multipart/form-data; boundary=CbotRul3z", function(data){
					if(successCB) successCB(data);
				}, function(errorcode){
					console.log('Error posting tweet:' + errorcode);
					if (errorCB) errorCB(errorcode);
				});
        }
    },
	addContactToList: function(user){
		$('ul#friendsList').append('<li><img src="' + user.profile_image_url + '\" width=\"40\" height=\"40\"/><label for=\"sample2\">'+user.name +'- @' + user.screen_name +'</label><input type=\"checkbox\" id=\"'+ '@' + user.screen_name +'\"></li>');
	},
	getContacts: function() {
	  
		$.ajax({
			url: "http://130.192.85.173:8888/getFriends"+"?sessionID="+sessionID,
			type: 'GET',
			data: JSON.stringify({"sessionID": sessionID}),				
			dataType: 'json',

			success: function (data) {
			  for(var i in data)
			    TwitterHelper.addContactToList(data[i]);
			},
			error: function (data) {
			   console.log("Error: " + data);			   			   			   
			   
			}
		    });	  
	},
	addTimelineToList: function(data){  
		$('ul#timeline').append('<li onclick=reTweet("' + data.user.screen_name +'");><a href="#menucreate"><img src="' + data.user.profile_image_url  + '">' + '<h3>' + data.user.name +' <span>' + "@"+data.user.screen_name + '</span></h3><p>' + data.text + '</p>' + '<p class="date">' + data.created_at + '</p>' + '</a></li>');
	},
	getTimeline: function() {
	
		$.ajax({
		url: "http://130.192.85.173:8888/getTimeline"+"?sessionID="+sessionID,
		type: 'GET',
		data: JSON.stringify({"sessionID": sessionID}),				
		dataType: 'json',

		success: function (data) {		 
		  for(var i in data)
		    TwitterHelper.addTimelineToList(data[i]);
		},
		error: function (data) {
		    console.log("Error: " + data);			   			   			   
		    
		}
	    });	   
	},
	logout: function(successCB, errorCB){
		    $.ajax({
			url: "http://130.192.85.173:8888/logout",
			type: 'POST',
			data: JSON.stringify({"sessionID": sessionID}),				
			dataType: 'json',

			success: function (data) {
			   TwitterHelper.isReady = false;
			   if(successCB) successCB(data);	
			   $('#status').css('visibility', 'hidden');
			   $('#status_ko').css('visibility', 'visible');
			},
			error: function (data) {
			  TwitterHelper.isReady = false;

			   if(errorCB) errorCB(data);
			   console.log("Error: " + JSON.stringify(data));
			}
		    });	
	}
};

function reTweet(data){
  $('#tbox').find("textarea").val('@' + data);
}

function randomString(length) {
    var chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz'.split('');    
    if (! length) 
	length = Math.floor(Math.random() * chars.length);    
    var str = '';
    for (var i = 0; i < length; i++)
	str += chars[Math.floor(Math.random() * chars.length)];
    return str;
}

function isAlreadyAuthenticated(){
  if(TwitterHelper.isReady == false)
  {
	$.ajax({
		url: "http://130.192.85.173:8888/isAlreadyAuthenticated",
		type: 'POST',
		data: JSON.stringify({"sessionID": sessionID}),
		dataType: 'json',

		success: function (data) {		 
		  console.log('isAlreadyAuthenticated:' + data);
		  
		    if(data == true){		      
		      console.log("isAlreadyAuthenticated: " + data);
		      TwitterHelper.getContacts();
		      TwitterHelper.getTimeline();
		      TwitterHelper.isReady = true;
		      $('#status').css('visibility', 'visible');
		      $('#status_ko').css('visibility', 'hidden');
		    }
		    else{

		      $.ajax({
			url: "http://130.192.85.173:8888/authenticate",     //?sessionID="+sessionID,
			type: 'POST',
			data: JSON.stringify({"sessionID": sessionID}),
			dataType: 'json',
			//type: 'GET',

			success: function (data) {
				if(data){
					window.open(data.authURL);
					console.log("devServer<authURL> " + data.authURL);
				}
				else{
					console.log('Error: no URL recived');
					alert("Server error!");
				}
			},
			error: function (data) {
				console.log('Authenticate Error: ' + data.responseText);
			}
		      });
		    }
		},
		error: function (data) {
		    console.log('IsAlreadyAuthenticate Error: ' + JSON.stringify(data));
		}
	});
  }
}

function checkDeletion(){
	//console.log("checking for deletions...");

	var contacts = $('#friendsList').find('li').find('input');		//TwitterContactsRawList
	var androidContacts = $('#contactList').find('li').find('input');	//AndroidContactsRawList

	if (androidContacts !== undefined) {
		for(var i=0;i<androidContacts.length;i++){
		  var flagged = false;

		  if(usrEmails !== undefined)					//do not add Android contacts without Twitter infos
		    for(var j=0;j<usrEmails.length;j++)
		      if(usrEmails[j].address === androidContacts[i].id)
			flagged = true;

		  if(!flagged)
		    contacts.push(androidContacts[i]);				//add the whole tag
		}
	}

	var txtBox = $('#tbox').find("textarea").val();
	if(txtBox !== "" && !isListening){					//if isListening it's useless
	  for(var i=0;i<contacts.length;i++)
	    if(txtBox.indexOf(contacts[i].id) == "-1")
		$(contacts[i]).attr("checked", false);				//uncheck contacts[i].id if deleted from textarea
	    else
		$(contacts[i]).attr("checked", true);				//check contacts[i].id if handwritten in textarea
	}	
	
	setTimeout(checkDeletion, 500);
}


//When the document loads
$(document).ready(function(){
	// When the browser registers, initialize the service
	TwitterHelper.isReady = false;
	webinos.session.addListener('registeredBrowser',TwitterHelper.init); 
	// Init special things for demo2
	InitGUI();
});
