import { apiClient, attachSessionHandlers } from "@/lib/api/axios"
import { ApiError } from "@/lib/api/api-error"
import { mockApi } from "@/test-utils/mock-api"
import { createProduct } from "@/test-utils/product-fixtures"
import { createAuthUser } from "@/test-utils/auth-fixtures"
import {
  deleteProductImage,
  getProductImages,
  orderProductImages,
  uploadProductImages,
} from "@/services/products/product-images.api"

const images = [
  {
    id: "opaque-id",
    url: "http://localhost:3001/uploads/products/test.png",
    isCover: true,
    position: 0,
  },
]
const product = {
  ...createProduct({ imageUrl: images[0].url }),
  status: "ACTIVE",
}
let token = "access-token"
const clearSession = vi.fn()
const requestRefresh = vi.fn()
beforeEach(() => {
  token = "access-token"
  vi.clearAllMocks()
  attachSessionHandlers({
    getAccessToken: () => token,
    clearSession,
    requestRefresh,
    updateSession: (session) => {
      token = session.accessToken
    },
  })
})

it("uploads repeated images fields with auth, no JSON header, and maps the complete response", async () => {
  const files = [
    new File(["png"], "a.png", { type: "image/png" }),
    new File(["webp"], "b.webp", { type: "image/webp" }),
  ]
  const transport = mockApi(() => ({
    status: 201,
    data: { data: images, product },
  }))
  apiClient.defaults.headers.common["Content-Type"] = "application/json"
  try {
    const result = await uploadProductImages({ productId: "PRD-1001", files })
    const request = transport.requests[0]
    expect(request.url).toBe("/products/PRD-1001/images")
    expect(request.headers.authorization).toBe("Bearer access-token")
    expect(request.headers["content-type"]).toBeUndefined()
    expect(request.body).toBeInstanceOf(FormData)
    expect([...(request.body as FormData).keys()]).toEqual(["images", "images"])
    expect((request.body as FormData).getAll("images")).toEqual(files)
    expect(result).toEqual({
      data: images,
      product: { ...product, status: "active" },
    })
  } finally {
    delete apiClient.defaults.headers.common["Content-Type"]
    transport.restore()
  }
})

it("uses the opaque server ID for replacement and deletion", async () => {
  const transport = mockApi(() => ({ data: { data: images, product } }))
  try {
    await uploadProductImages({
      productId: "PRD-1001",
      files: [new File(["png"], "x.png")],
      replaceImageId: "ext-abc",
    })
    await deleteProductImage("PRD-1001", "ext-abc")
    expect(transport.requests[0].params).toEqual({ replaceImageId: "ext-abc" })
    expect(transport.requests[1]).toMatchObject({
      method: "DELETE",
      url: "/products/PRD-1001/images/ext-abc",
      body: undefined,
    })
  } finally {
    transport.restore()
  }
})

it("reads actual metadata and sends only version/cover/gallery when ordering", async () => {
  const transport = mockApi((request) => ({
    data: request.method === "GET" ? { data: images } : product,
  }))
  try {
    expect(await getProductImages("PRD-1001")).toEqual(images)
    await orderProductImages("PRD-1001", 4, images)
    expect(transport.requests[1].body).toEqual({
      version: 4,
      imageUrl: images[0].url,
      galleryUrls: [],
    })
  } finally {
    transport.restore()
  }
})

it("reuses session refresh and replays the same FormData after an expired access token", async () => {
  requestRefresh.mockResolvedValue({
    accessToken: "renewed",
    user: createAuthUser(),
  })
  const transport = mockApi((_request, index) =>
    index === 0
      ? { status: 401, data: { message: "Unauthorized" } }
      : { data: { data: images, product } }
  )
  try {
    await uploadProductImages({
      productId: "PRD-1001",
      files: [new File(["png"], "x.png")],
    })
    expect(requestRefresh).toHaveBeenCalledTimes(1)
    expect(transport.requests[1].body).toBe(transport.requests[0].body)
    expect(transport.requests[1].headers.authorization).toBe("Bearer renewed")
    expect(transport.requests[1].headers["content-type"]).toBeUndefined()
  } finally {
    transport.restore()
  }
})

it("reports an expired session without retrying the image mutation", async () => {
  requestRefresh.mockRejectedValue(new ApiError(401, ["Session expired"]))
  const transport = mockApi(() => ({
    status: 401,
    data: { statusCode: 401, message: "Unauthorized", error: "Unauthorized" },
  }))
  try {
    await expect(
      uploadProductImages({
        productId: "PRD-1001",
        files: [new File(["x"], "x.png")],
      })
    ).rejects.toMatchObject({ status: 401, messages: ["Unauthorized"] })
    expect(transport.requests).toHaveLength(1)
    expect(clearSession).toHaveBeenCalled()
  } finally {
    transport.restore()
  }
})

it.each([400, 403, 404, 413, 429, 500])(
  "preserves the backend error envelope for status %s",
  async (status) => {
    const transport = mockApi(() => ({
      status,
      data: {
        statusCode: status,
        message: ["Image upload refused"],
        error: "Error",
      },
    }))
    try {
      await expect(
        uploadProductImages({
          productId: "PRD-1001",
          files: [new File(["x"], "x.png")],
        })
      ).rejects.toMatchObject({ status, messages: ["Image upload refused"] })
      expect(transport.requests).toHaveLength(1)
    } finally {
      transport.restore()
    }
  }
)
