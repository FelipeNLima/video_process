Feature: Video Processing
  As a user
  I want to upload and process videos
  So that I can store them in an S3 bucket and receive a confirmation email

  Scenario: Successfully process and upload a video
    Given a video file "test-video.mp4" is uploaded
    When the video is processed
    Then the video should be uploaded to the S3 bucket
    And a success email should be sent