'use server'

import { fileSchema } from './schemas';

// import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
// const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.mjs');
// pdfjsLib.disableWorker = true
// pdfjsLib.GlobalWorkerOptions.workerSrc = ''
// import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.min.mjs'
// pdfjsLib.GlobalWorkerOptions.workerSrc = '/build/pdf.worker.mjs';
import * as pdfjsLib from 'pdfjs-dist/build/pdf.min.mjs';
await import('pdfjs-dist/build/pdf.worker.min.mjs');

export async function extractBankTransactions(data) {

  const { formData } = data
  const file = formData.get('bank_statement')
  const result = fileSchema.safeParse({ file })
  if (!result.success) {
    const errors = result.error.errors.map((error) => error.message);
    throw new Error(errors.join(','));
  }
  const pdfData = await file.arrayBuffer()
  // const pdfDoc = await pdfjsLib.getDocument({ data: pdfData }).promise
  const pdfDoc = await pdfjsLib.getDocument({ data: pdfData }).promise

  const extractedTexts = []
  const pageCount = pdfDoc.numPages

  let statementNumber = ""
  let filterItems = ["", " ", "Értéknap", "Tranzakció adatai", "Terhelés", "Jóváírás", "Bankszámlakivonat"]
  for (let i = 0; i < pageCount; i++) {
    const page = await pdfDoc.getPage(i + 1)
    const textContent = await page.getTextContent()
    textContent.items.map(item => {
      if (item.str.startsWith("Kivonat száma:")) {
        statementNumber = item.str.split(":")[1].trim()
      }
      if (!filterItems.includes(item.str) && !item.str.startsWith("Oldalszám:")) {
        extractedTexts.push(item.str)
      }
    })
  }

  const startIndex = extractedTexts.indexOf("FOLYÓSZÁMLA FORGALMAK")
  const endIndex = extractedTexts.indexOf("Összesen:")

  const transactionsArr = extractedTexts.slice(startIndex, endIndex)
  // let transactionsArrWithoutSummary = transactionsArr.slice(0, -3)
  let transactionsArrWithoutSummary = transactionsArr
  transactionsArrWithoutSummary.shift()

  const dateRegex = /^\d{4}\.\d{2}\.\d{2}$/

  let transactionIndex = []
  transactionsArrWithoutSummary.forEach((item, index) => {
    if (dateRegex.test(item)) {
      transactionIndex.push(index)
    }
  })
  let slicedTransactionsArray = []
  transactionIndex.forEach((item, index) => {
    if (index !== transactionIndex.length - 1) {
      const startIndex = item;
      const endIndex = transactionIndex[index + 1] - 1
      const slicedItems = transactionsArrWithoutSummary.slice(startIndex, endIndex + 1)
      slicedTransactionsArray.push(slicedItems)

    } else {
      const startIndex = item;
      const endIndex = transactionsArrWithoutSummary.length - 1
      const slicedItems = transactionsArrWithoutSummary.slice(startIndex, endIndex + 1)
      slicedTransactionsArray.push(slicedItems)
    }
  })

  const transactionObjectsArray = slicedTransactionsArray.map((transaction) => {
    const date = transaction[0]
    const amount = parseFloat(transaction[transaction.length - 1].replace(/\./g, ""))
    const notes = transaction.slice(1, transaction.length - 1).join(" ")
    return { statementNumber, date, notes, amount }
  })

  console.log(slicedTransactionsArray);
  // return extractedTexts
  return transactionObjectsArray

}



