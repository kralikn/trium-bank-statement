import * as z from 'zod';

export const createAndEditTopicSchema = z.object({
  topic_title: z.string().min(3, {
    message: "A témakörnek legalább 3 karakternek kell lennie!"
  })
});
export const uploadFileSchema = z.object({
  file: z.string().min(3, {
    message: "A témakörnek legalább 3 karakternek kell lennie!"
  })
})

export const fileSchema = z.object({
  file: validateFile()
})

function validateFile() {
  const acceptedFileTypes = ['application/pdf']
  return z.instanceof(File).refine((file) => {
    return !file || acceptedFileTypes.some((type) => file.type.startsWith(type))
  }, 'Csak pdf tölthető fel!')
}