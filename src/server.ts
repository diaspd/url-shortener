import fastify from "fastify";
import { z } from 'zod'
import { sql } from "./lib/postgres";
import postgres from "postgres";

const app = fastify()

app.get('/:code', async (request) => {
  const getLinkSchema = z.object({
    code: z.string().min(3),
  })

  const { code } = getLinkSchema.parse(request.params)

  const result = await sql/*sql*/`
    SELECT id, original_url
    FROM short_links
    WHERE short_links.code = ${code}
  `

  return result
})

app.get('/api/links', async () => {
  const result = await sql/*sql*/`
    SELECT *
    FROM short_links
    ORDER BY created_at DESC
  `

  return result
})

app.post('/api/links', async (request, reply) => {
  const createLinkSchema = z.object({
    code: z.string().min(3),
    url: z.string().url(),
  })

  const { code, url } = createLinkSchema.parse(request.body)

  try {
    const result = await sql/*sql*/`
      INSERT INTO short_links (code, original_url)
      VALUES (${code}, ${url})
      RETURNING id
    `

    const link = result[0]

    return reply.status(201).send({ shortLinkId: link.id })
  } catch (err) {
    if (err instanceof postgres.PostgresError) {
      if (err.code === '23505') {
        return reply.status(400).send({ message: 'Duplicated code!' })
      }
    }

    console.error(err)

    return reply.status(500).send({ message: 'Internal error.' })
  }
})

app.listen({ 
  port: 3333
}).then(() => {
  console.log('Http server running! 🚀')
})