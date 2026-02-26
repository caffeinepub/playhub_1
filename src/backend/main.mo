import List "mo:core/List";
import Nat "mo:core/Nat";
import Text "mo:core/Text";
import Set "mo:core/Set";
import Map "mo:core/Map";
import Iter "mo:core/Iter";
import Runtime "mo:core/Runtime";
import Order "mo:core/Order";

actor {
  type Video = {
    id : Nat;
    title : Text;
    description : Text;
    youtubeUrl : Text;
    category : Text;
    thumbnailUrl : Text;
  };

  module Video {
    public func compareByCategory(video1 : Video, video2 : Video) : Order.Order {
      Text.compare(video1.category, video2.category);
    };
  };

  type HighScore = {
    gameName : Text;
    highScore : Nat;
  };

  module HighScore {
    public func compareByScore(highScore1 : HighScore, highScore2 : HighScore) : Order.Order {
      Nat.compare(highScore1.highScore, highScore2.highScore);
    };
  };

  let videos = List.empty<Video>();
  let highScores = Map.empty<Text, Nat>();

  var nextVideoId = 1;

  public query ({ caller }) func getAllVideos() : async [Video] {
    videos.toArray();
  };

  public query ({ caller }) func getVideosByCategory(category : Text) : async [Video] {
    videos.toArray().filter(func(video) { video.category == category });
  };

  public query ({ caller }) func getAllCategories() : async [Text] {
    let categories = Set.empty<Text>();
    videos.values().forEach(
      func(video) {
        categories.add(video.category);
      }
    );
    categories.toArray();
  };

  public shared ({ caller }) func addVideo(title : Text, description : Text, youtubeUrl : Text, category : Text, thumbnailUrl : Text) : async () {
    let video : Video = {
      id = nextVideoId;
      title;
      description;
      youtubeUrl;
      category;
      thumbnailUrl;
    };

    videos.add(video);
    nextVideoId += 1;
  };

  public shared ({ caller }) func saveHighScore(gameName : Text, score : Nat) : async () {
    switch (highScores.get(gameName)) {
      case (null) {
        highScores.add(gameName, score);
      };
      case (?existingScore) {
        if (score > existingScore) {
          highScores.add(gameName, score);
        };
      };
    };
  };

  public query ({ caller }) func getHighScore(gameName : Text) : async Nat {
    switch (highScores.get(gameName)) {
      case (null) { Runtime.trap("No high score for this game") };
      case (?score) { score };
    };
  };
};
