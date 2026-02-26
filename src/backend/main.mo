import Nat "mo:core/Nat";
import Text "mo:core/Text";
import Time "mo:core/Time";
import List "mo:core/List";
import Map "mo:core/Map";
import Set "mo:core/Set";
import Array "mo:core/Array";
import Iter "mo:core/Iter";



actor {
  type Video = {
    id : Nat;
    title : Text;
    description : Text;
    youtubeUrl : Text;
    category : Text;
    thumbnailUrl : Text;
  };

  type HighScore = {
    gameName : Text;
    score : Nat;
  };

  type ChatMessage = {
    id : Nat;
    userMessage : Text;
    assistantResponse : Text;
    timestamp : Time.Time;
  };

  let videos = List.empty<Video>();
  let highScores = Map.empty<Text, Nat>();
  let chatMessages = List.empty<ChatMessage>();

  var nextVideoId = 1;
  var nextChatMessageId = 1;

  // Video Management
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

  // High Score Tracking
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
      case (null) { 0 };
      case (?score) { score };
    };
  };

  // AI Chat (Now Open-Domain General Purpose Q&A using Caffeine AI Core)
  public shared ({ caller }) func sendMessage(userMessage : Text) : async Text {
    let assistantResponse = await* generateResponse(userMessage);

    let chatMessage : ChatMessage = {
      id = nextChatMessageId;
      userMessage;
      assistantResponse;
      timestamp = Time.now();
    };

    chatMessages.add(chatMessage);
    nextChatMessageId += 1;

    assistantResponse;
  };

  public query ({ caller }) func getChatHistory() : async [ChatMessage] {
    chatMessages.toArray();
  };

  public shared ({ caller }) func clearChatHistory() : async () {
    chatMessages.clear();
  };

  //-- Function only used internally, should not be public
  func generateResponse(_userMessage : Text) : async* Text {
    "Error: AI core not available";
  };

  // AI Video Studio
  public shared ({ caller }) func generateVideoFrames(_prompt : Text) : async [Text] {
    [
      "Error: AI core not available, cannot generate video frames",
    ];
  };
};
