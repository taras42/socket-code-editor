(function(APP) {
	$(function () {
		var socket = io();

		var editorTextArea = $("#editor")[0],
	        lenguageSelect = $("#lenguage"),
	        copyRoomLinkButton = $("#copyRoomLink"),
	        copyLocationInput = $("#copyLocationInput");

        var roomLocation = document.location.href,
        	roomId = roomLocation.split("/").reverse()[0];

    	var name = prompt("Enter your name:") || "User" + Date.now();

		APP.init({
			name: name,
			roomId: roomId,
			roomLocation: roomLocation,
			socket: socket,
			editorTextArea: editorTextArea,
			lenguageSelect: lenguageSelect,
			copyRoomLinkButton: copyRoomLinkButton,
			copyLocationInput: copyLocationInput
		});
	});
})(APP);