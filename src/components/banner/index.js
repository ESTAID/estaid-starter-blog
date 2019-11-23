import React from "react"
import Img from "gatsby-image"
import "./index.scss"

const Banner = ({ banner, title }) =>
  banner ? (
    <div className="banner">
      <Img sizes={banner.childImageSharp.fluid} alt={title} />
    </div>
  ) : null

export default Banner
