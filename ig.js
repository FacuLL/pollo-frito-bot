const { IgApiClient } = require('instagram-private-api');
const bluebird = require('bluebird');
const fs = require('fs');
const { promisify } = require('util');
var https = require('https');
const Jimp = require("jimp");
const extractFrames = require('ffmpeg-extract-frames');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffmpeg = require('fluent-ffmpeg');
ffmpeg.setFfmpegPath(ffmpegPath);

const readFileAsync = promisify(fs.readFile);
const ig = new IgApiClient();

const hashtags = " \n. \n.\nSeguinos para más contenido! @pollofritocommunity \n. \n. \nTags (ignorar): \n#memes #dankmemes #funnymemes #memesdaily #dylenteromemes #offensivememes #dailymemes #animememes #tiktokmemes #memesespañol #memesespañol #dankmemesdaily #shitpost #bestmemes #meme #darkmemes #wholesomememes #memestar #stolenmemes #instamemes #memesargentina #memesarg #memesquad #indianmemes #shit #minecraftmemes #gamingmemes #dylanteromemes #funniestmemes #memesgraciosos";

async function loginIg(username, password) {
  try {
  ig.state.generateDevice(username);
  const user = await ig.account.login(username, password);
  process.nextTick(async () => await ig.simulate.postLoginFlow());

  await bluebird.delay(2000);
  await ig.feed.news().items();
  await bluebird.delay(2000);
  await ig.feed.discover();
  console.log('Iniciado sesion en instagram correctamente como ' + username);
  return user;
  }
  catch(e) {
    console.log('no se pudo iniciar sesion. Error: ' + e);
    return;
  }
}

async function publishIg(url, caption) {
  await bluebird.delay(2000);
  await ig.feed.discover();
  await bluebird.delay(2000);
  await ig.feed.news().items();

  const extension = url.split(".").at(-1);
  var file = fs.createWriteStream("actual." + extension);
  var request = https.get(url, function(response) {
    response.pipe(file);
    file.on('finish', function() {
      publishIg2(extension, caption);  // close() is async, call cb after close completes.
    });
  }).on('error', function(err) { // Handle errors
    fs.unlink("actual." + extension, () => {}); // Delete the file async. (But we don't check the result)
    return "Error al descargar archivo";
  });
}

async function publishIg2(extension, caption) {
  const { latitude, longitude, searchQuery } = {latitude: 28.353, longitude: -81.675, searchQuery: 'KFC',};
  const locations = await ig.search.location(latitude, longitude, searchQuery);
  const mediaLocation = locations[0];
  const newcaption = caption + hashtags;
  if (extension == "png") {
    Jimp.read("actual.png", function (err, image) {
      publishigpng(image, newcaption, mediaLocation);
    });
  }
  else if (extension == "jpg" || extension == "jpeg") {
    const publishResult = await ig.publish.photo({
      file: await readFileAsync("actual." + extension),
      caption: newcaption,
      location: mediaLocation
    });
    console.log('Imagen subida con exito');
    fs.unlink("actual." + extension, () => {});
    return publishResult;
  }
  else if (extension == "mp4" || extension == "mov") {
    await extractFrames({
      input: 'actual.' + extension,
      output: './cover.jpg',
      offsets: [5]
    });
    const publishResult = await ig.publish.video({
      video: await readFileAsync('actual.' + extension),
      coverImage: await readFileAsync('cover.jpg'),
      caption: newcaption,
      location: mediaLocation
    });
    console.log('Video subido con exito');
    fs.unlink("actual." + extension, () => {});
    fs.unlink("cover.jpg", () => {});
    return publishResult;
  }
  else {
    console.log('Extension invalida');
    fs.unlink("actual." + extension, () => {});
    return "Extension invalida";
  }
}

async function publishigpng(image, caption, mediaLocation) {
  await image.write("./actual.jpg");
  const newcaption = caption + hashtags;

  const publishResult = await ig.publish.photo({
    file: await readFileAsync("./actual.jpg"),
    caption: newcaption,
    location: mediaLocation
  });
  fs.unlink("./actual.jpg", () => {});
  fs.unlink("./actual.png", () => {});
  console.log('Imagen subida con exito');
  return publishResult;
}

module.exports = {loginIg, publishIg};