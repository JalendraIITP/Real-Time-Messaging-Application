import "./styles.css";
import { Input } from "@chakra-ui/input";
import { useEffect, useState } from "react";
import { Box, Text } from "@chakra-ui/layout";
import ScrollableChat from "./ScrollableChat";
import { ChatState } from "../Context/ChatProvider";
import { FormControl } from "@chakra-ui/form-control";
import ProfileModal from "./miscellaneous/ProfileModal";
import { getSender, getSenderFull } from "../config/ChatLogics";
import UpdateGroupChatModal from "./miscellaneous/UpdateGroupChatModal";
import {IconButton, Spinner, useToast } from "@chakra-ui/react";
import { ArrowBackIcon } from "@chakra-ui/icons";

import io from "socket.io-client";
const ENDPOINT = "https://real-time-messaging-application-0.onrender.com"; 
var socket, selectedChatCompare;

const SingleChat = ({ fetchAgain, setFetchAgain, axiosInstance }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [socketConnected, setSocketConnected] = useState(false);
  const [typing, setTyping] = useState(false);
  const [istyping, setIsTyping] = useState(false);
  const toast = useToast();

  const { selectedChat, setSelectedChat, user, notification, setNotification } = ChatState();

  const fetchMessages = async () => {
    if (!selectedChat) return;
    try {
      setLoading(true);
      const { data } = await axiosInstance.get(
        `/api/message/${selectedChat._id}`
      );
      setMessages(data);
      setLoading(false);
      socket.emit("join chat", selectedChat._id);
    } catch (error) {
      toast({
        title: "Error Occured!",
        description: "Failed to Load the Messages",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom",
      });
    }
  };

  const sendMessage = async (event) => {
    if (event.key === "Enter" && newMessage) {
      socket.emit("stop typing", selectedChat._id);
      try {
        const payload = {
          content: newMessage,
          chatId: selectedChat,
        }
        setNewMessage("");
        const { data } = await axiosInstance.post(
          "/api/message", payload
        );
        socket.emit("new message", data);
        // setMessages([...messages, data]);
        setFetchAgain((prev) => !prev);
        // setSelectedChat(selectedChat);
        setMessages(messages => [...messages, data]);
      } catch (error) {
        toast({
          title: "Error Occured!",
          description: error.message,
          status: "error",
          duration: 5000,
          isClosable: true,
          position: "bottom",
        });
      }
    }
  };

  useEffect(() => {
    socket = io(ENDPOINT);
    socket.emit("setup", user);
    socket.on("connected", () => setSocketConnected(true));
    socket.on("typing", () => setIsTyping(true));
    socket.on("stop typing", () => setIsTyping(false));

    return () => {
      socket.off("connected");
      socket.off("typing");
      socket.off("stop typing");
    };
  },[user]);

  useEffect(() => {
    fetchMessages();
    selectedChatCompare = selectedChat;
  }, [selectedChat]);

  useEffect(() => {
    if (!socket) return;

    const handleMessage = (newMessageRecieved) => {
      if (
        !selectedChatCompare ||
        selectedChatCompare._id !== newMessageRecieved.chat._id
      ) {
        if (!notification.find(n => n._id === newMessageRecieved._id)) {
          setNotification((prev) => [newMessageRecieved, ...prev]);
          setFetchAgain((prev) => !prev);
        }
      } else {
        setMessages((prev) => [...prev, newMessageRecieved]);
      }
    };

    socket.on("message recieved", handleMessage);

    return () => {
      socket.off("message recieved", handleMessage);
    };
  }, [selectedChatCompare, notification]);


  const typingHandler = (e) => {
    setNewMessage(e.target.value);

    if (!socketConnected) return;

    if (!typing) {
      setTyping(true);
      socket.emit("typing", selectedChat._id);
    }
    let lastTypingTime = new Date().getTime();
    var timerLength = 3000;
    setTimeout(() => {
      var timeNow = new Date().getTime();
      var timeDiff = timeNow - lastTypingTime;
      if (timeDiff >= timerLength && typing) {
        socket.emit("stop typing", selectedChat._id);
        setTyping(false);
      }
    }, timerLength);
  };

  return (
    <>
      {selectedChat ? (
        <>
          <Text
            fontSize={{ base: "28px", md: "30px" }}
            pb={3}
            px={2}
            w="100%"
            fontFamily="Work sans"
            display="flex"
            justifyContent={{ base: "space-between" }}
            alignItems="center"
          >
            <IconButton
              d={{ base: "flex", md: "none" }}
              icon={<ArrowBackIcon />}
              onClick={() => setSelectedChat("")}
            />
            {messages && 
              (!selectedChat.isGroupChat ? (
                <>
                  {getSender(user, selectedChat.users)}
                  <ProfileModal
                    user={getSenderFull(user, selectedChat.users)}
                  />
                </>
              ) : (
                <>
                  {selectedChat.chatName.toUpperCase()}
                  <UpdateGroupChatModal
                    fetchMessages={fetchMessages}
                    fetchAgain={fetchAgain}
                    setFetchAgain={setFetchAgain}
                    axiosInstance={axiosInstance}
                  />
                </>
              ))}
          </Text>
          <Box
            display="flex"
            flexDir="column"
            justifyContent="flex-end"
            p={3}
            bg="#E8E8E8"
            w="100%"
            h="90%"
            borderRadius="lg"
            overflowY="hidden"
          >
            {loading ? (
              <Spinner
                size="xl"
                w={20}
                h={20}
                alignSelf="center"
                margin="auto"
              />
            ) : (
              <div className="messages">
                <ScrollableChat messages={messages} />
              </div>
            )}

            <FormControl
              onKeyDown={sendMessage}
              id="first-name"
              isRequired
              mt={3}
              display="flex" 
              alignItems="center" 
              justifyContent="center"
            >
              <Input
                variant="filled"
                bg="#E0E0E0"
                placeholder={istyping ? "Typing..." : "Enter a message..."}
                value={newMessage}
                onChange={typingHandler}
              />
              {/* <Flex align="center" w='1000px'bg="#E0E0E0" borderRadius='5px'>
                  <IconButton
                    icon={<AttachmentIcon />}
                    aria-label="Add File"
                    bg="chat.addButtonBackground"
                    size="sm"
                    h='40px'
                    w='40px'
                    mr="5px"
                  />
                  <Input
                    bg="transparent"
                    color="chat.textColor"
                    border="none"
                    h='40px'
                    w='100%'
                    mr="5px"
                    placeholder="Enter a message.."
                    value={newMessage}
                    onChange={typingHandler}
                  />
                  <IconButton
                    icon={<ArrowForwardIcon />}
                    aria-label="Send Message"
                    bg="#70a1da"
                    size="sm"
                    h='40px'
                    w='50px'
                    onClick={sendMessage}
                  />
                </Flex> */}
            </FormControl>
          </Box>
        </>
      ) : (
        <Box display="flex" alignItems="center" justifyContent="center" h="100%">
          <Text fontSize="3xl" pb={3} fontFamily="Work sans">
            Click on a user to start chatting
          </Text>
        </Box>
      )}
    </>
  );
};

export default SingleChat;
