import { Star, StarHalf } from 'lucide-react'
import React, { FC } from 'react'

type Props = {
  rating: number
}


const Ratings: FC<Props> = ({ rating }) => {
  const stars = [];

  for (let i = 1; i <= 5; i++) {
    if (i <= rating) {
      // Full star
      stars.push(<Star key={`star-${i}`} className="text-yellow-500" fill="currentColor" />)
    } else if (i === Math.ceil(rating) && !Number.isInteger(rating)) {
      // Half star
      stars.push(<StarHalf key={`half-${i}`} className="text-yellow-500" fill="currentColor" />)
    } else {
      // Empty star
      stars.push(<Star key={`empty-${i}`} className="text-gray-400" />)
    }
  }

  return <div className="flex items-center gap-1">{stars}</div>

}

export default Ratings