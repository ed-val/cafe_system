# cafe_system
A small CLI with API included to sort and optimize orders from a coffee shop selling system

# seco-IPH

## Fix android release apk

This project was built using RN 0.59.8 tha has an issue with the
latest gradle of android. This gradle bundles the release apk in a folder RN is not specting, ergo, crashes in release version.
To fix this downgrade app gradle to 3.3.0

> android/gradle/wrapper/gradle-wrapper.properties:

```sh
distributionUrl=https\://services.gradle.org/distributions/gradle-4.10.1-all.zip
```
and

> android/build.gradle:

```sh
classpath 'com.android.tools.build:gradle:3.3.0'
```

## Get Android mapbox GL running on REACT 0.59 and mapbox 6.1.3

### The idea is basically to Support the Gradle Plugin version 3.3.1

After react 0.58, gradle from 2.2.1 and earlier is not supported. Mapbox GL use dependencies that need that gradle. To fix this we need to tell mapbox gradle to use the dependencies which make use of gradle 3.3.1 as well.

Inside the project folder. Then go to:

> $(PROYECT_FOLDER).../node_modules/@mapbox/react-native-mapbox-gl/android/rctmgl/build.gradle

Change all the content of that folder with this:

```java
apply plugin: 'com.android.library'

android {
    compileSdkVersion 28
    buildToolsVersion '28.0.3'

    defaultConfig {
        minSdkVersion 16
        targetSdkVersion 28
        versionCode 1
        versionName "1.0"
    }

    buildTypes {
        release {
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
}

dependencies {
    implementation fileTree(dir: 'libs', include: ['*.jar'])

    // React Native
    compileOnly "com.facebook.react:react-native:+"

    // Mapbox SDK
    implementation 'com.mapbox.mapboxsdk:mapbox-android-services:2.2.9'

    // Fix issues
    implementation 'com.android.support:support-vector-drawable:28.0.0'
    implementation 'com.android.support:support-annotations:28.0.0'
    implementation 'com.android.support:appcompat-v7:28.0.0'
    implementation 'com.squareup.okhttp3:okhttp:3.12.1'

    implementation 'com.mapbox.mapboxsdk:mapbox-android-sdk:5.5.1@aar'

    // Mapbox plugins
    implementation 'com.mapbox.mapboxsdk:mapbox-android-plugin-localization:0.1.0'
    implementation 'com.mapbox.mapboxsdk:mapbox-android-plugin-locationlayer:0.3.0'
}
```
