const { Given, Then, When } = require('@cucumber/cucumber');
const { deepStrictEqual } = require('assert');

const answer = {
   file: { mimetype: 'video/mp4', path: 'test-video.mp4' }
}

class VideoService {
  async processVideo(video) {
    return video
  }
};

Given('a video file {string} is uploaded', function (fileName) {
  VideoService = new VideoService();
  this.video = { file: { mimetype: 'video/mp4', path: fileName } };
});

When('the video is processed', async function () {
  this.result = await VideoService.processVideo(this.video);
});

Then('the video should be return file', function () {
  deepStrictEqual(this.result, answer)
});