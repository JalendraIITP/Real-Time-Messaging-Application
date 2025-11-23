import asyncHandler from"express-async-handler";
import Message from"../models/messageModel.js";
import User from"../models/userModel.js";
import Chat from"../models/chatModel.js";
import cache from "../config/cache.js";

const allMessages = asyncHandler(async (req, res) => {
  const chatId = req.params.chatId;
  const cachedMessages = cache.get(chatId);

  if (cachedMessages) {
    console.log("⚡ Served from cache");
    return res.status(200).json(cachedMessages);
  }
  try {
    const messages = await Message.find({ chat: req.params.chatId })
      .populate("sender", "name pic email")
      .populate("chat");

    cache.set(chatId, messages);
    console.log("✅ Cached messages for chat:", chatId);

    res.status(200).json(messages);
  } catch (error) {
    res.status(500);
    throw new Error(error.message);
  }
});

const sendMessage = asyncHandler(async (req, res) => {
  const { content, chatId } = req.body;
  if (!content || !chatId) {
    return res.status(400).json({ message: "Empty Message!" });
  }

  const newMessage = {
    sender: req.user._id,
    content,
    chat: chatId,
  };

  try {
    let message = await Message.create(newMessage);

    message = await message.populate([
      { path: "sender", select: "name pic" },
      { path: "chat", populate: { path: "users", select: "name pic email" } },
    ]);

    await Chat.findByIdAndUpdate(chatId, { latestMessage: message._id });

    cache.del(String(chatId._id));
    console.log("🧹 Cache invalidated for chat:", String(chatId._id));

    return res.status(200).json(message);
  } catch (error) {
    return res.status(500).json({ message: "Failed to send message", error: error.message });
  }
});


export default { allMessages, sendMessage };
