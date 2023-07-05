
import { Dispatch, SetStateAction, createContext, memo, useEffect, useState } from "react";
import { Dimensions, StyleSheet, Text, TextInput, View, Button } from "react-native";
import { Authenticator, useTheme } from "@aws-amplify/ui-react-native";
import { Amplify, Auth } from "aws-amplify";
import awsconfig from "./src/aws-exports";
import * as Notifications from "expo-notifications";
import Icon from "react-native-vector-icons/Ionicons";
// import Storage from "react-native-storage";
// import AsyncStorage from "@react-native-async-storage/async-storage";

import { cards } from "./data/cards";   // ダミーデータ (YOLP API使用予定)
import { Prefecture } from "./data/globals";
import AuthenticatorFormFields from "./components/login/AuthenticatorFormFields";
import TinderSwipe from "./components/home/TinderSwipe";
import Detail from "./components/home/Detail";
import Notice from "./components/notice/Notice";
import Map from "./components/map/Map";
import Favorites from "./components/favorites/Favorites";
import Spots from "./components/favorites/Spots";
import User from "./components/user/User";
import Footer from "./components/Footer";

Auth.configure(awsconfig);
Amplify.configure(awsconfig);

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: true,
  }),
});

const SERVER_URL = "https://o49zrrdot8.execute-api.us-east-1.amazonaws.com/tokitabi";
const SCREEN_HEIGHT = Dimensions.get("window").height;
const SCREEN_WIDTH = Dimensions.get("window").width;

type Props = [
  page: string,
  setPage: Dispatch<SetStateAction<string>>,
  prefecture: string,
  setPrefecture: Dispatch<SetStateAction<string>>,
  hasVisited: boolean,
  setHasVisited: Dispatch<SetStateAction<boolean>>
];

export const MyContext = createContext<Props>([ "", () => {}, "", () => {}, false, () => {} ]);

// // ストレージの作成
// export const storage: Storage = new Storage({
//   // 最大容量
//   size: 1000,
//   // バックエンドにAsyncStorageを使う
//   storageBackend: AsyncStorage,
//   // キャッシュ期限(null=期限なし)
//   defaultExpires: null,
//   // メモリにキャッシュするかどうか
//   enableCache: true,
//   // 初期化時にデータを同期するためのオプション
//   sync: {},
// });

const App = memo(() => {
  const [noticeCount, setNoticeCount] = useState(3);   // 通知カウント設定
  const [touchId, setTouchId] = useState(0);
  const [favoriteData, setFavoriteData] = useState<Prefecture[]>([]);
  const [username, setUsername] = useState("");
  const [page, setPage] = useState("home");
  const [index, setIndex] = useState(0);
  const [prefecture, setPrefecture] = useState("");
  const [inputRef, setInputRef] = useState("");
  const [hasVisited, setHasVisited] = useState(false);
  const [ramdomCards, setRamdomCards] = useState([]);
  const [ramdomCardsChange, setRamdomCardsChange] = useState(false);

  useEffect(() => {
    (async () => {
      const ramdomCardsData = await fetch(`${SERVER_URL}/api/cards/test`).then(data => data.json());
      setRamdomCards(ramdomCardsData);
    })()
  }, [ramdomCardsChange]);

  useEffect(() => {
    requestPermissionsAsync();
    Notifications.setBadgeCountAsync(0);

    // storage
    //   .load({ key: "data" })
    //   .then((res) => console.log("App", res))
    //   .catch((err) => console.warn("App", err));
  }, []);

  // description 通知数設定用
  const userToApp = (userdata: SetStateAction<number>) => setNoticeCount(userdata);

  //description ID取得用
  const spotToApp = (id: SetStateAction<number>) => setTouchId(id);

  useEffect(() => {
    (async () => {
      try {
        const user = await Auth.currentAuthenticatedUser();
        setUsername(user.attributes.nickname);
      } catch (error) {
        console.log("Error getting username:", error);
      }
    })()
  }, []);

  useEffect(() => {
    (async () => {
      favoriteData.length !== 0 &&
        favoriteData.forEach(async (obj) => {
          obj.number >= noticeCount &&
            // プッシュ通知を実際に送信する
            (await Notifications.scheduleNotificationAsync({
              content: {
                body: `🧳旅行先が『${obj.number}ヶ所』溜まっています!!`,
                title: `${obj.name}に行ってみませんか？`,
                sound: "default",
                // subtitle: 'subtitle',
                // badge: 1,
              },
              trigger: {
                seconds: 1,
              },
            }));
          Notifications.setBadgeCountAsync(1);
        });
    })();
  }, [favoriteData]);

  const scheduleNotificationAsync = async () => {
    const res = await fetch(`${SERVER_URL}/api/favorites`).then(data => data.json());
    setFavoriteData(res);
  };

  const requestPermissionsAsync = async () => {
    // 現時点の通知権限の情報を取得する
    const { granted } = await Notifications.getPermissionsAsync();
    if (granted) return;

    // ユーザーに通知権限を要求するポップアップを出す
    await Notifications.requestPermissionsAsync();
  };

  // フィルターに使う予定
  console.log(inputRef);

  return (
    <Authenticator.Provider>
      <Authenticator
        Header={() => {
          const { tokens } = useTheme();
          return (
            <View>
              <Text style={{ fontSize: tokens.fontSizes.xxl, padding: tokens.space.large }}>
                とき旅
              </Text>
            </View>
          )
        }}
        Container={props =>
          <Authenticator.Container
            {...props}
            style={{ backgroundColor: "white" }}
          />
        }
        initialState="signIn"
        components={{
          // サインアップフィールド
          SignUp: ({ fields, ...props }) =>
            <Authenticator.SignUp {...props} fields={AuthenticatorFormFields} />,
          // サインインフィールド
          SignIn: ({ fields, ...props }) =>
            <Authenticator.SignIn
              {...props}
              fields={[
                {
                  name: "username",
                  label: "ユーザーネーム",
                  type: "default",
                  placeholder: "ユーザーネーム",
                },
                {
                  name: "password",
                  label: "パスワード",
                  type: "default",
                  placeholder: "パスワード",
                  secureTextEntry: true,
                },
              ]}
            />,
        }}
      >
        <View style={styles.container}>
          <MyContext.Provider value={[ page, setPage, prefecture, setPrefecture, hasVisited, setHasVisited ]}>
            {page === "home" && (
              <View>
                <View style={styles.header}>
                  <Icon name="search-outline" style={styles.headerIcon} />
                  <TextInput
                    placeholder="キーワード検索"
                    style={styles.headerTextInput}
                    value={inputRef}
                    onChangeText={(text) => setInputRef(text)}
                  />
                  <Icon name="menu-outline" style={styles.headerIcon} />
                </View>
                <View style={styles.main}>
                  <Text style={styles.mainText}>おすすめ終了！</Text>
                  {/* {cards.map((card, index) => ( */}
                  {ramdomCards && ramdomCards.map((card, index) => (
                    <TinderSwipe
                      key={index}
                      index={index}
                      card={card}
                      setPage={setPage}
                      setIndex={setIndex}
                      scheduleNotificationAsync={scheduleNotificationAsync}
                      ramdomCards={ramdomCards}
                    />
                  ))}
                </View>
              </View>
            )}

            {page === "detail" &&
              <Detail page={page} setPage={setPage} index={index} hasVisited={null} touchId={touchId} ramdomCards={ramdomCards} />
            }

            {page === "notice" &&
              <Notice />
            }

            {page === "map" &&
              <Map setPage={setPage} setIndex={setIndex} />
            }

            {page === "fromMap" &&
              <Detail page={page} setPage={setPage} index={index} hasVisited={null} touchId={touchId} ramdomCards={null} />
            }

            {page === "favorites" &&
              <Favorites />
            }

            {page === "spots" &&
              <Spots setPage={setPage} prefecture={prefecture} setIndex={setIndex} setHasVisited={setHasVisited} appToSpot={spotToApp} />
            }

            {page === "visited" &&
              <Detail page={page} setPage={setPage} index={index} hasVisited={hasVisited} touchId={touchId} ramdomCards={null} />
            }

            {page === "user" &&
              <User userName={username} noticeSet={noticeCount} appToUser={userToApp} />
            }

            {page !== "detail" && page !== "visited" && page !== "fromMap" &&
              <Footer page={page} setPage={setPage} />
            }
          </MyContext.Provider>
        </View>
      </Authenticator>
    </Authenticator.Provider>
  );
});

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "white",
  },
  header: {
    flexDirection: "row",
    backgroundColor: "white",
    justifyContent: "space-between",
    margin: 10,
    padding: 10,
    top: 50,
    borderRadius: 30,
    shadowColor: "rgb(200, 200, 200)",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.5,
    zIndex: 1,
  },
  headerIcon: {
    fontSize: 30,
    color: "rgb(130, 130, 130)",
  },
  headerTextInput: {
    width: "70%",
  },
  main: {
    position: "absolute",
    height: SCREEN_HEIGHT,
    width: SCREEN_WIDTH,
    paddingBottom: 100,
  },
  mainText: {
    position: "absolute",
    marginTop: Dimensions.get("window").height / 2,
    marginHorizontal: 140,
  },
});

export default App;
