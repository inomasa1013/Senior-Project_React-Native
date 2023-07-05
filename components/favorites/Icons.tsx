
import React, { Dispatch, SetStateAction, memo } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';

import { Prefecture } from '../../data/globals';

type Props = {
  favoriteData: Array<Prefecture>;
  setPage: Dispatch<SetStateAction<string>>;
  setPrefecture: Dispatch<SetStateAction<string>>;
};

const Icons: React.FC<Props> = memo(({ favoriteData, setPage, setPrefecture }) => {

  return (
    <View style={styles.scrollView}>
      {favoriteData.map((dataObj, index) =>
        <TouchableOpacity
          key={index}
          onPress={() => {
            setPrefecture(dataObj.name);
            setPage("spots");
          }}
        >
          <Text style={styles.number}>{ dataObj.number }</Text>
          <View style={styles.spotContainer}>
            <View style={styles.imageWrapper}>
              <Image style={styles.photo} source={{uri: dataObj.imgSrc}} alt={`${dataObj.name}の写真`} />
            </View>
            <Text style={styles.name}>{ dataObj.name }</Text>
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  scrollView: {
    justifyContent: "space-between",
    top: 50,
    flexDirection: "row",
    flexWrap: "wrap",   // 要素を自動的に折り返す
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  number: {
    zIndex: 1,
    textAlign: "center",
    height: 30,
    width: 30,
    fontSize: 18,
    color: "white",
    fontWeight: "600",
    backgroundColor: "rgb(255, 100, 100)",
    borderRadius: 15,
    paddingTop: 5,
    position: "absolute",
    top: 0,
    left: 130,
    overflow: "hidden",
  },
  spotContainer: {
    alignItems: "center",
  },
  imageWrapper: {
    borderWidth: 3,
    borderColor: "white",
    borderRadius: 15,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.3,
  },
  photo: {
    height: 150,
    width: 150,
    borderRadius: 15,
  },
  name: {
    marginBottom: 25,
  },
});

export default Icons;
