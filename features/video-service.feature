Feature: Video Processing and Upload

  Scenario: Successfully process and upload a video
    Given a video file "test-video.mp4" is uploaded
    When the video is processed
    Then the video should be return file