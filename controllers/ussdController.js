const log = require("signale");
const config = require("config");
const User = require("../models/userModel");

const getNextScreen = (nextScreen, input) => {
  switch (nextScreen) {
    case "register-home":
      if (input === "1") {
        nextScreen = "register-name";
      } else if (input === "2") {
        nextScreen = "quit";
      }
      break;

    // case "hospital registration":
    //   if (input === "1") {
    //     nextScreen = "roles";
    //   } else if (input === "2") {
    //     nextScreen = "hospital_ranks";
    //   }
    //   break;

    case "home":
      if (input === "1") {
        nextScreen = "hospital_ranks";
      } else if (input === "2") {
        nextScreen = "talk-to-an-agent";
      } else if (input === "3") {
        nextScreen = "crowdfunding";
      } else if (input === "4") {
        nextScreen = "quit";
      }
      break;

    case "crowdfunding":
      if (input === "1") {
        nextScreen = "metamask";
      } else if (input === "2") {
        nextScreen = "m-pesa";
      }

      break;
  }
  return nextScreen;
};

exports.handleUssdSession = async (
  notification,
  customer,
  appData,
  callback
) => {
  const sessionId = notification.sessionId;
  const input = notification.input.text;
  let { nextScreen = "home" } = appData || {};

  log.info(`Processing USSD from ${customer.customerNumber.number}`);
  log.info(nextScreen);

  const customerData = await customer.getMetadata();
  let { name, address, role, registered = false, collector } = customerData;

  console.log(customerData);
  const menu = {
    text: "Welcome to You Matter DAO",
    isTerminal: false,
  };

  if (!registered && nextScreen == "home") {
    nextScreen = "register-home";
  }

  // Bootstrap screen flow
  nextScreen = getNextScreen(nextScreen, input);

  const activity = {
    key: null,
    sessionId,
    properties: {
      name,
      address,
      role,
      registered,
    },
  };

  switch (nextScreen) {
    // Registration
    case "register-home":
      menu.text = `${menu.text}\n1. Register\n2. Quit`;
      activity.key = "RegistrationStart";
      break;

    case "register-name":
      menu.text = "What is your name?";
      nextScreen = "register-location";
      activity.key = "RegistrationGetName";
      break;

    case "register-location":
      name = input;
      menu.text = `Great ${name}, whats your location?\n${config
        .get("locations")
        .map((i, idx) => `${idx + 1}. ${i}`)
        .join("\n")}`;
      nextScreen = "register-role";
      activity.key = `RegistrationGetLocation`;
      activity.properties = {
        ...activity.properties,
        name,
      };
      break;

    case "register-role":
      address = config.get("locations")[parseInt(input, 10) - 1];
      registered = true;
      menu.text = `You can also specify your role\n${config
        .get("roles")
        .map((i, idx) => `${idx + 1}. ${i}`)
        .join("\n")}`;
      nextScreen = "register-complete";
      activity.key = "RegistrationGetRole";
      activity.properties = {
        ...activity.properties,
        address,
      };
      break;

    case "register-complete":
      role = config.get("roles")[parseInt(input, 10) - 1];
      menu.text = `Great! Thank you ${name} for registering on You Matter DAO. We are processing your application and will get back to you shortly`;
      menu.isTerminal = true;
      registered = true;
      activity.key = "RegistrationFinished";
      activity.properties = {
        ...activity.properties,
        role,
        registered,
      };

      nextScreen = "home";
      const text = `Hi ${name}, thank you for joining You Matter family. Dial ${process.env.USSD_CODE} to get started`;

      customer
        .sendMessage(
          {
            number: process.env.SENDER_ID,
            channel: "sms",
          },
          {
            body: {
              text,
            },
          }
        )
        .catch(console.log("hghjklk"));

      break;

    // main menu
    case "home":
      menu.text = `Welcome to You Matter DAO!\n1.View Hospitals \n2.Talk to an Agent\n3.Crowdfunding\n4.Quit\n`;
      activity.key = "showHome";
      break;

    // case "hospital registration":
    //   menu.text =
    //     "Okay! Are you a public hospital or a private hospital?\n1. Public Hospital \n2. Private Hospital\n3. back";
    //   break;

    // case "roles":
    //   menu.text =
    //     "Greetings Hospital! Please select services needed?\n1.Track Patients' Data \n2.Send SMS reminder\n3.back";
    //   nextScreen = "home";
    //   menu.isTerminal = true;
    //   break;

    case "hospital_ranks":
      menu.text = `Here are top rated hospitals available in your area\n${config
        .get("hospitals")
        .map((i, idx) => `${idx + 1}. ${i}`)
        .join("\n")}`;
      nextScreen = "home";
      menu.isTerminal = true;
      break;

    case "crowdfunding":
      menu.text = "Fund a community activity\n1. Metamask Harmony and Polygon wallet\n2. Mpesa";
      break;

    case "metamask":
      menu.text = "Wallet Address: 0x........\nCheck your inbox for the addresses.";
      menu.isTerminal = true;

      nextScreen = "home";
      var messo = `Hello, thank you for donating to You Matter family. The polygon address is 0x........ and the harmony one is 0x............`;

      customer
        .sendMessage(
          {
            number: process.env.SENDER_ID,
            channel: "sms",
          },
          {
            body: {
              messo,
            },
          }
        )
        .catch(console.log("error"));

      break;

    case "m-pesa":
      menu.text = "Not available at the moment";
      nextScreen = "home";
      menu.isTerminal = true;
      break;

    // case "view-hospitals":
    //   menu.text = `Here are hospitals available in your area\n${config
    //     .get("hospitals")
    //     .map((i, idx) => `${idx + 1}. ${i}`)
    //     .join("\n")}`;
    //   nextScreen = "home";
    //   break;

    case "hospitals":
      hospital = config.get("hospitals")[parseInt(input, 10) - 1];
      menu.text = `Here is the contact of the hospital you have selected\n${config
        .get(`contacts.${hospital}`)
        .map((i, idx) => `${idx + 1}. ${i}`)
        .join("\n")}`;
      menu.isTerminal = true;
      nextScreen = "home";
      break;


      case "talk-to-an-agent":
        menu.text = "Here are some of our agents\n1. +254711231121\n2. +1261627812121";
        nextScreen = "home";
        menu.isTerminal = true;
        break;

    case "quit":
      menu.text = "Thank you for using You Matter DAO";
      menu.isTerminal = true;
      activity.key = "Quit";
      nextScreen = "home";
      callback(menu, {
        screen: nextScreen,
      });
      break;
  }

  await customer.updateMetadata({
    name,
    address,
    registered,
    collector,
  });

  callback(menu, { ...appData, nextScreen });
  customer
    .updateActivity(config.get("activityChannel"), activity)
    .catch(console.error);

  // console.log(newUser);
};
