from sentence_transformers import SentenceTransformer

model = SentenceTransformer("BAAI/bge-small-en-v1.5")


def embed(texts):

    vectors = model.encode(
        texts,
        normalize_embeddings=True
    )

    return vectors.tolist()


def batch_embed(texts, batch_size=64):

    vectors = []

    for i in range(0, len(texts), batch_size):

        batch = texts[i:i + batch_size]

        vec = embed(batch)

        vectors.extend(vec)

    return vectors