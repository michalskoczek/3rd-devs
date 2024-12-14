import express from "express";
import { OpenAIService } from './OpenAIService';

const app = express();
const port = 3000;
const openAIService = new OpenAIService();

app.get("/", async (req, res) => {
  try {
    const response = await fetch('https://xyz.ag3nts.org');
    const html = await response.text();
    
    const regex = /<p id="human-question">Question:<br \/>(.*?)<\/p>/;
    const match = html.match(regex);
    
    if (!match || !match[1]) {
      res.status(404).send('Nie znaleziono pytania');
      return;
    }

    const question = match[1].trim();
    
    const completion = await openAIService.completion([
      {
        role: "user",
        content: question
      }
    ]);

    if (!('choices' in completion)) {
      throw new Error('Otrzymano nieprawidłową odpowiedź');
    }

    const aiResponse = completion.choices[0]?.message?.content || 'Brak odpowiedzi';
 
    const postResponse = await fetch('https://xyz.ag3nts.org/', {
      "headers": {
          "content-type": "application/x-www-form-urlencoded",
      },
      "body": "username=tester&password=574e112a&answer=" + aiResponse,
      "method": "POST",});

    const result = await postResponse.text();
    console.log(result);
    
  } catch (error) {
    console.error('Błąd:', error);
    res.status(500).send('Wystąpił błąd podczas przetwarzania zapytania');
  }
});

app.listen(port, () => {
  console.log(`Serwer działa na porcie ${port}`);
});

