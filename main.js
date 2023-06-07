import AgoraRTC from "agora-rtc-sdk-ng"
import VirtualBackgroundExtension from "agora-extension-virtual-background";

var isSharingEnabled = false;
var isMuteVideo = false;
var isMuteAudio = false;

let options =
{
  // Pass your App ID here.
  appId: '441150b9073b4ca7acbeb81d00f5c035',
  // Set the channel name.
  channel: 'demo',
  // Pass your temp token here.
  token: '007eJxTYMgIMrkQGnVh/7r0k/d/NqdviduXzpB7ctHd2Rw6X5mqbnIrMJiYGBqaGiRZGpgbJ5kkJ5onJielJlkYphgYpJkmGxibXpNvSGkIZGT4v/geKyMDBIL4LAwpqbn5DAwAuG8hQQ==',
  // Set the user ID.
  uid: 0,
};

let channelParameters =
{
  // A variable to hold a local audio track.
  localAudioTrack: null,
  // A variable to hold a local video track.
  localVideoTrack: null,
  // A variable to hold a remote audio track.
  remoteAudioTrack: null,
  // A variable to hold a remote video track.
  remoteVideoTrack: null,
  // A variable to hold the remote user id.s
  remoteUid: null,
};
async function startBasicCall() {
  // Create an instance of the Agora Engine

  const agoraEngine = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
  // Dynamically create a container in the form of a DIV element to play the remote video track.
  const remotePlayerContainer = document.createElement("div");
  // Dynamically create a container in the form of a DIV element to play the local video track.
  const localPlayerContainer = document.createElement('div');
  // Specify the ID of the DIV container. You can use the uid of the local user.
  localPlayerContainer.id = options.uid;
  // Set the textContent property of the local video container to the local user id.
  localPlayerContainer.textContent = "Local user " + options.uid;
  // Set the local video container size.
  localPlayerContainer.style.width = "240px";
  localPlayerContainer.style.height = "280px";
  localPlayerContainer.style.padding = "15px 5px 5px 5px";
  localPlayerContainer.style.float= 'left'
  // Set the remote video container size.
  remotePlayerContainer.style.width = "240px";
  remotePlayerContainer.style.height = "280px";
  remotePlayerContainer.style.padding = "15px 5px 5px 5px";
  // Listen for the "user-published" event to retrieve a AgoraRTCRemoteUser object.
  AgoraRTC.onAutoplayFailed = () => {
    // Create button for the user interaction.
    const btn = document.createElement("button");
    // Set the button text.
    btn.innerText = "Click me to resume the audio/video playback";
    // Remove the button when onClick event occurs.
    btn.onClick = () => {
      btn.remove();
    };
    // Append the button to the UI.
    document.body.append(btn);
  }

  // Set an event listener on the range slider.
  document.getElementById("localAudioVolume").addEventListener("change", function (evt) {
    console.log("Volume of local audio :" + evt.target.value);
    // Set the local audio volume.
    channelParameters.localAudioTrack.setVolume(parseInt(evt.target.value));
  });
  // Set an event listener on the range slider.
  document.getElementById("remoteAudioVolume").addEventListener("change", function (evt) {
    console.log("Volume of remote audio :" + evt.target.value);
    // Set the remote audio volume.
    channelParameters.remoteAudioTrack.setVolume(parseInt(evt.target.value));
  });

  AgoraRTC.onMicrophoneChanged = async (changedDevice) => {
    // When plugging in a device, switch to a device that is newly plugged in.
    if (changedDevice.state === "ACTIVE") {
      localAudioTrack.setDevice(changedDevice.device.deviceId);
      // Switch to an existing device when the current device is unplugged.
    } else if (changedDevice.device.label === localAudioTrack.getTrackLabel()) {
      const oldMicrophones = await AgoraRTC.getMicrophones();
      oldMicrophones[0] && localAudioTrack.setDevice(oldMicrophones[0].deviceId);
    }
  }

  AgoraRTC.onCameraChanged = async (changedDevice) => {
    // When plugging in a device, switch to a device that is newly plugged in.
    if (changedDevice.state === "ACTIVE") {
      localVideoTrack.setDevice(changedDevice.device.deviceId);
      // Switch to an existing device when the current device is unplugged.
    } else if (changedDevice.device.label === localVideoTrack.getTrackLabel()) {
      const oldCameras = await AgoraRTC.getCameras();
      oldCameras[0] && localVideoTrack.setDevice(oldCameras[0].deviceId);
    }
  }

  agoraEngine.on("user-published", async (user, mediaType) => {
    // Subscribe to the remote user when the SDK triggers the "user-published" event.
   

    await agoraEngine.subscribe(user, mediaType);
    console.log("subscribe success");
    // Subscribe and play the remote video in the container If the remote user publishes a video track.
    if (mediaType == "video") {
      // Retrieve the remote video track.
      channelParameters.remoteVideoTrack = user.videoTrack;
      // Retrieve the remote audio track.
      channelParameters.remoteAudioTrack = user.audioTrack;
      // Save the remote user id for reuse.
      channelParameters.remoteUid = user.uid.toString();
      // Specify the ID of the DIV container. You can use the uid of the remote user.
      remotePlayerContainer.id = user.uid.toString();
      channelParameters.remoteUid = user.uid.toString();
      remotePlayerContainer.textContent = "Remote user " + user.uid.toString();
      // Append the remote container to the page body.
      document.body.append(remotePlayerContainer);
      // Play the remote video track.
      channelParameters.remoteVideoTrack.play(remotePlayerContainer);
    }
    // Subscribe and play the remote audio track If the remote user publishes the audio track only.
    if (mediaType == "audio") {
      // Get the RemoteAudioTrack object in the AgoraRTCRemoteUser object.
      channelParameters.remoteAudioTrack = user.audioTrack;
      // Play the remote audio track. No need to pass any DOM element.
      channelParameters.remoteAudioTrack.play();
    }
    // Listen for the "user-unpublished" event.
    agoraEngine.on("user-unpublished", user => {
      console.log(user.uid + "has left the channel");
    });
  });
  window.onload = function () {
    // Listen to the Join button click event.
    document.getElementById("join").onclick = async function () {
      // Join a channel.
      await agoraEngine.join(options.appId, options.channel, options.token, options.uid);
      
      // Create a local audio track from the audio sampled by a microphone.
      channelParameters.localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack();
      // Create a local video track from the video captured by a camera.
      channelParameters.localVideoTrack = await AgoraRTC.createCameraVideoTrack();
      // Append the local video container to the page body.
      document.body.append(localPlayerContainer);
      // Publish the local audio and video tracks in the channel.
      await agoraEngine.publish([channelParameters.localAudioTrack, channelParameters.localVideoTrack]);
      // Play the local video track.
      channelParameters.localVideoTrack.play(localPlayerContainer);
      console.log("publish success!");
    }

    document.getElementById('muteVideo').onclick = async function () {
      if (isMuteVideo == false) {
        // Mute the local video.
        channelParameters.localVideoTrack.setEnabled(false);
        // Update the button text.
        document.getElementById(`muteVideo`).innerHTML = "Unmute Video";
        isMuteVideo = true;
      } else {
        // Unmute the local video.
        channelParameters.localVideoTrack.setEnabled(true);
        // Update the button text.
        document.getElementById(`muteVideo`).innerHTML = "Mute Video";
        isMuteVideo = false;
      }
    }

    document.getElementById('muteAudio').onclick = async function () {
      if (isMuteAudio == false) {
        // Mute the local audio.
        channelParameters.localAudioTrack.setEnabled(false);
        // Update the button text.
        document.getElementById(`muteAudio`).innerHTML = "Unmute Audio";
        isMuteAudio = true;
      }
      else {
        // Unmute the local audio.
        channelParameters.localAudioTrack.setEnabled(true);
        // Update the button text.
        document.getElementById(`muteAudio`).innerHTML = "Mute Audio";
        isMuteAudio = false;
      }
    }

    // document.getElementById('inItScreen').onclick = async function () {

    //   if (isSharingEnabled == false) {
    //     // Create a screen track for screen sharing.
    //     channelParameters.screenTrack = await AgoraRTC.createScreenVideoTrack();
    //     // Current video track
    //     const localVideoTrack = await AgoraRTC.createCameraVideoTrack();
    //     // Gets the new video track (option one)
    //     var newTrack = localVideoTrack.getMediaStreamTrack();
    //     // Gets the new video track (option two)
    //     var newTrack = await navigator.mediaDevices.getUserMedia({ audio: true, video: true }).then(mediaStream => mediaStream.getVideoTracks()[0]);
    //     // Replaces and stops the current video track
    //     await localVideoTrack.replaceTrack(newTrack, true);
    //     // Replace the video track with the screen track.
    //     await channelParameters.localVideoTrack.replaceTrack(newTrack, true);
    //     // Update the button text.
    //     document.getElementById('inItScreen').innerHTML = "Stop Sharing";
    //     // Update the screen sharing state.
    //     isSharingEnabled = true;
    //   } else {
    //     // Replace the screen track with the local video track.
    //     const localVideoTrack = await AgoraRTC.createCameraVideoTrack();
    //     // Gets the new video track (option one)
    //     var newTrack = localVideoTrack.getMediaStreamTrack();
    //     // Gets the new video track (option two)
    //     var newTrack = await navigator.mediaDevices.getUserMedia({ audio: true, video: true }).then(mediaStream => mediaStream.getVideoTracks()[0]);
    //     // Replaces and stops the current video track
    //     await localVideoTrack.replaceTrack(newTrack, true);
    //     await channelParameters.screenTrack.replaceTrack(newTrack, true);
    //     // Update the button text.
    //     document.getElementById('inItScreen').innerHTML = "Share Screen";
    //     // Update the screen sharing state.
    //     isSharingEnabled = false;
    //   }
    // }

    document.getElementById('inItScreen').onclick = async function () {
      if (isSharingEnabled == false) {
        // Create a screen track for screen sharing.
        channelParameters.screenTrack = await AgoraRTC.createScreenVideoTrack();
        // Stop playing the local video track.
        channelParameters.localVideoTrack.stop();
        // Unpublish the local video track.
        await agoraEngine.unpublish(channelParameters.localVideoTrack);
        // Publish the screen track.
        await agoraEngine.publish(channelParameters.screenTrack);
        // Play the screen track on local container.
        channelParameters.screenTrack.play(localPlayerContainer);
        // Update the button text.
        document.getElementById(`inItScreen`).innerHTML = "Stop Sharing";
        // Update the screen sharing state.
        isSharingEnabled = true;
      } else {
        // Stop playing the screen track.
        channelParameters.screenTrack.stop();
        // Unpublish the screen track.
        await agoraEngine.unpublish(channelParameters.screenTrack);
        // Publish the local video track.
        await agoraEngine.publish(channelParameters.localVideoTrack);
        // Play the local video on the local container.
        channelParameters.localVideoTrack.play(localPlayerContainer);
        // Update the button text.
        document.getElementById(`inItScreen`).innerHTML = "Share Screen";
        // Update the screen sharing state.
        isSharingEnabled = false;
      }
    }

    // Listen to the Leave button click event.
    document.getElementById('leave').onclick = async function () {
      // Destroy the local audio and video tracks.
      channelParameters.localAudioTrack.close();
      channelParameters.localVideoTrack.close();
      // Remove the containers you created for the local video and remote video.
      removeVideoDiv(remotePlayerContainer.id);
      removeVideoDiv(localPlayerContainer.id);
      // Leave the channel
      await agoraEngine.leave();
      console.log("You left the channel");
      // Refresh the page for reuse
      window.location.reload();
    }

    
  }
}
startBasicCall();
// Remove the video stream from the container.
function removeVideoDiv(elementId) {
  console.log("Removing " + elementId + "Div");
  let Div = document.getElementById(elementId);
  if (Div) {
    Div.remove();
  }
};
