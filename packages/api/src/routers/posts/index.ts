import { router } from "../../index";

import { create, deletePost, like, repost, undoRepost, unlike } from "./mutations";
import {
  byHashtag,
  byUser,
  get,
  home,
  latest,
  likesByUser,
  repliesByUser,
  trending,
} from "./queries";

export const postsRouter = router({
  create,
  delete: deletePost,
  like,
  unlike,
  repost,
  undoRepost,
  home,
  latest,
  trending,
  byHashtag,
  byUser,
  repliesByUser,
  likesByUser,
  get,
});
