const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

module.exports = function (app) {
  function getRandomUA() {
    const file = path.join(__dirname, 'ua.txt');
    const lines = fs.readFileSync(file, 'utf-8').split('\n').map(x => x.trim()).filter(Boolean);
    if (!lines.length) throw new Error('ua.txt file is empty');
    return lines[Math.floor(Math.random() * lines.length)];
  }

  app.get('/ai/remakerai', async (req, res) => {
    const { prompt, rasio = '1:1', style = 'anime' } = req.query;

    if (!prompt) {
      return res.status(400).json({
        status: false,
        creator: 'Chamod Nimsara',
        message: 'The "prompt" parameter is required.'
      });
    }

    const rasioList = ['1:1', '2:3', '9:16', '3:2', '16:9'];
    const styleList = ['ghibli1', 'ghibli2', 'ghibli3', 'anime'];

    if (!rasioList.includes(rasio)) {
      return res.status(400).json({
        status: false,
        creator: 'Chamod Nimsara',
        message: `Invalid ratio. Choose one of: ${rasioList.join(', ')}`
      });
    }

    if (!styleList.includes(style)) {
      return res.status(400).json({
        status: false,
        creator: 'Chamod Nimsara',
        message: `Invalid style. Choose one of: ${styleList.join(', ')}`
      });
    }

    try {
      const ua = getRandomUA();

      const form = new FormData();
      form.append('prompt', prompt);
      form.append('style', style);
      form.append('aspect_ratio', rasio);

      const headers = {
        ...form.getHeaders(),
        accept: '*/*',
        'accept-language': 'en-US,en;q=0.9',
        authorization: '',
        origin: 'https://remaker.ai',
        'product-code': '067003',
        'product-serial': 'c25cb430662409bdea35c95eceaffa1f',
        referer: 'https://remaker.ai/',
        'user-agent': ua
      };

      // Step 1: Create job
      const { data: create } = await axios.post('https://api.remaker.ai/api/pai/v4/ai-anime/create-job', form, { headers });
      const job_id = create?.result?.job_id;

      if (!job_id) throw new Error('Failed to create job');

      // Step 2: Poll result
      for (let i = 0; i < 20; i++) {
        const { data: poll } = await axios.get(`https://api.remaker.ai/api/pai/v4/ai-anime/get-job/${job_id}`, { headers });
        const resultUrl = poll?.result?.output?.[0];

        if (resultUrl) {
          const image = await axios.get(resultUrl, { responseType: 'arraybuffer' });
          res.setHeader('Content-Type', 'image/png');
          return res.send(image.data);
        }

        await new Promise(r => setTimeout(r, 2000)); // Delay polling
      }

      throw new Error('Failed to get result (Timeout)');
    } catch (err) {
      return res.status(500).json({
        status: false,
        creator: 'Chamod Nimsara',
        message: 'Failed to process the request',
        error: err.message
      });
    }
  });
};
