import sharp from "sharp";

// const icon = 'data:image/png;base64,' + readFileSync('./public/bridgeo.png').toString('base64');
let icon = await sharp('./public/bridgeo.png')
    .resize(64, 64)
    .toBuffer();
icon = 'data:image/png;base64,' + icon.toString('base64');

export default icon;
